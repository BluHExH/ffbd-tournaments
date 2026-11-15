import {useEffect,useRef,useState} from "react";
import {ActivityIndicator,Linking,Text,TextInput,View} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {Button} from "@/components/UI";
import {AuthLayout,authStyles as s} from "@/components/AuthLayout";
import {supabase} from "@/lib/supabase";
import {theme} from "@/lib/theme";

type RecoveryParams = {
 code?: string | string[];
 access_token?: string | string[];
 refresh_token?: string | string[];
 type?: string | string[];
 token_hash?: string | string[];
 error?: string | string[];
 error_description?: string | string[];
};

const first = (value: string | string[] | undefined) =>
 Array.isArray(value) ? value[0] : value;

function readRecoveryUrl(rawUrl: string) {
 const parsed = new URL(rawUrl);
 const query = parsed.searchParams;
 const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
 // Supabase may return PKCE code in the query, or implicit-flow tokens in the fragment.
 // Read both locations because Android custom-scheme links can preserve either format.
 return {
  code: query.get("code") || hash.get("code"),
  accessToken: hash.get("access_token") || query.get("access_token"),
  refreshToken: hash.get("refresh_token") || query.get("refresh_token"),
  type: hash.get("type") || query.get("type"),
  tokenHash: query.get("token_hash") || hash.get("token_hash"),
  error: query.get("error") || hash.get("error"),
  errorDescription: query.get("error_description") || hash.get("error_description"),
 };
}

export default function ResetPassword(){
 const params=useLocalSearchParams<RecoveryParams>();
 const [ready,setReady]=useState(false);
 const [linkValid,setLinkValid]=useState(false);
 const [busy,setBusy]=useState(false);
 const [password,setPassword]=useState("");
 const [confirm,setConfirm]=useState("");
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const processing=useRef(false);
 const verified=useRef(false);

 useEffect(()=>{
  let active=true;
  let noLinkTimer: ReturnType<typeof setTimeout> | undefined;

  const verifyValues=async(values:ReturnType<typeof readRecoveryUrl>)=>{
   if(!active || verified.current || processing.current)return;
   if(values.error){
    setError(values.errorDescription || values.error);
    setReady(true);
    return;
   }
   if(!values.code && !(values.accessToken && values.refreshToken && values.type==="recovery") && !(values.tokenHash && values.type==="recovery"))return;
   if(!supabase){
    setError("App connection is not configured.");
    setReady(true);
    return;
   }
   processing.current=true;
   try{
    let authError:Error|null=null;
    if(values.code){
     const result=await supabase.auth.exchangeCodeForSession(values.code);
     authError=result.error;
    }else if(values.accessToken && values.refreshToken && values.type==="recovery"){
     const result=await supabase.auth.setSession({access_token:values.accessToken,refresh_token:values.refreshToken});
     authError=result.error;
    }else if(values.tokenHash && values.type==="recovery"){
     const result=await supabase.auth.verifyOtp({token_hash:values.tokenHash,type:"recovery"});
     authError=result.error;
    }
    if(authError)throw authError;
    verified.current=true;
    if(active){
     if(noLinkTimer)clearTimeout(noLinkTimer);
     setLinkValid(true);
     setReady(true);
     setError("");
    }
   }catch(cause){
    if(active){
     setError(cause instanceof Error?cause.message:"Could not verify the reset link. Request a new link.");
     setReady(true);
    }
   }finally{
    processing.current=false;
   }
  };

  const handleUrl=(rawUrl:string|null)=>{
   if(!rawUrl)return;
   try{void verifyValues(readRecoveryUrl(rawUrl));}
   catch{
    if(active){setError("The reset link could not be read. Request a new password reset email.");setReady(true);}
   }
  };

  // Listen first so a link arriving while the app is already open is not missed.
  const subscription=Linking.addEventListener("url",event=>handleUrl(event.url));

  // Expo Router may expose URL parameters separately from React Native Linking.
  const routeValues={
   code:first(params.code),
   accessToken:first(params.access_token),
   refreshToken:first(params.refresh_token),
   type:first(params.type),
   tokenHash:first(params.token_hash),
   error:first(params.error),
   errorDescription:first(params.error_description),
  };
  void verifyValues(routeValues as ReturnType<typeof readRecoveryUrl>);

  void Linking.getInitialURL().then(handleUrl).catch(()=>{});
  // Do not show the missing-link error until the initial Android deep link has had
  // time to arrive and both Expo Router params and Linking have been checked.
  noLinkTimer=setTimeout(()=>{
   if(active && !verified.current && !processing.current){
    setError("No reset link was received. Open the latest reset email link again, or request a new password reset email.");
    setReady(true);
   }
  },1200);

  return()=>{
   active=false;
   if(noLinkTimer)clearTimeout(noLinkTimer);
   subscription.remove();
  };
 },[params.code,params.access_token,params.refresh_token,params.type,params.token_hash,params.error,params.error_description]);

 const submit=async()=>{
  setError("");setSuccess("");
  if(!supabase){setError("App connection is not configured.");return}
  if(password.length<8){setError("Use a password with at least 8 characters.");return}
  if(password!==confirm){setError("The passwords do not match.");return}
  setBusy(true);
  try{
   const {error}=await supabase.auth.updateUser({password});
   if(error){setError(error.message);return}
   setSuccess("Your password has been changed successfully. You can now sign in with your new password.");
   await supabase.auth.signOut();
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to update your password. Request a new reset link.");}
  finally{setBusy(false)}
 };

 if(!ready)return <View style={{flex:1,backgroundColor:"#0B1221",alignItems:"center",justifyContent:"center"}}><ActivityIndicator color={theme.accent}/><Text style={{color:"#94A3B8",marginTop:12}}>Verifying reset link…</Text></View>;
 return <AuthLayout eyebrow="ACCOUNT RECOVERY" title="Set a new password" description="Choose a new password for your BANGLAR TOURNAMENTS account." footer="Remembered your password?" footerAction="Back to login" onFooterPress={()=>router.replace("/login")}>
  {success?<><Text accessibilityRole="alert" style={s.success}>{success}</Text><Button onPress={()=>router.replace("/login")}>GO TO LOGIN</Button></>:linkValid?<>
   <View style={{gap:7}}><Text style={s.fieldLabel}>NEW PASSWORD</Text><TextInput value={password} onChangeText={v=>{setPassword(v);setError("")}} placeholder="At least 8 characters" placeholderTextColor="#64748B" secureTextEntry autoComplete="new-password" textContentType="newPassword" style={s.input}/></View>
   <View style={{gap:7}}><Text style={s.fieldLabel}>CONFIRM NEW PASSWORD</Text><TextInput value={confirm} onChangeText={v=>{setConfirm(v);setError("")}} placeholder="Enter password again" placeholderTextColor="#64748B" secureTextEntry autoComplete="new-password" textContentType="newPassword" style={s.input}/></View>
   {error?<Text accessibilityRole="alert" style={s.error}>{error}</Text>:null}
   <Button loading={busy} disabled={busy} onPress={submit}>UPDATE PASSWORD</Button>
  </>:<>
   <Text accessibilityRole="alert" style={s.error}>{error||"Open the password reset link from your email on this device."}</Text>
   <Button onPress={()=>router.replace("/forgot-password")}>REQUEST NEW RESET LINK</Button>
  </>}
 </AuthLayout>;
}
