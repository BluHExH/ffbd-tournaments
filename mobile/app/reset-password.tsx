import {useEffect,useState} from "react";
import {ActivityIndicator,Linking,Text,TextInput,View} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {Button} from "@/components/UI";
import {AuthLayout,authStyles as s} from "@/components/AuthLayout";
import {supabase} from "@/lib/supabase";
import {theme} from "@/lib/theme";

export default function ResetPassword(){
 const params=useLocalSearchParams<{code?:string;access_token?:string;refresh_token?:string;type?:string;token_hash?:string}>();
 const routeCode=typeof params.code==="string"?params.code:undefined;
 const routeAccessToken=typeof params.access_token==="string"?params.access_token:undefined;
 const routeRefreshToken=typeof params.refresh_token==="string"?params.refresh_token:undefined;
 const routeType=typeof params.type==="string"?params.type:undefined;
 const routeTokenHash=typeof params.token_hash==="string"?params.token_hash:undefined;
 const [ready,setReady]=useState(false);const [linkValid,setLinkValid]=useState(false);const [busy,setBusy]=useState(false);
 const [password,setPassword]=useState("");const [confirm,setConfirm]=useState("");
 const [error,setError]=useState("");const [success,setSuccess]=useState("");
 useEffect(()=>{
  let active=true;let verified=false;
  const acceptLink=async(url:string|null)=>{
   if(!supabase){if(active){setError("App connection is not configured.");setReady(true)}return}
   let code=routeCode,accessToken=routeAccessToken,refreshToken=routeRefreshToken,type=routeType,tokenHash=routeTokenHash;
   if(url){
    try{
     const parsed=new URL(url);
     const query=parsed.searchParams;
     const hash=new URLSearchParams(parsed.hash.replace(/^#/,""));
     code=query.get("code")||code;
     accessToken=hash.get("access_token")||query.get("access_token")||accessToken;
     refreshToken=hash.get("refresh_token")||query.get("refresh_token")||refreshToken;
     type=hash.get("type")||query.get("type")||type;
     tokenHash=query.get("token_hash")||hash.get("token_hash")||tokenHash;
    }catch{
     if(active){setError("The reset link could not be read. Request a new password reset email.");setReady(true)}
     return;
    }
   }
   if(!code&&!(accessToken&&refreshToken&&type==="recovery")&&!(tokenHash&&type==="recovery")){
    if(active&&!verified){setError("No reset link was received. Open the latest reset email link again, or request a new password reset email.");setReady(true)}
    return;
   }
   try{
    let authError:null|{message:string}=null;
    if(code){
     const result=await supabase.auth.exchangeCodeForSession(code);authError=result.error;
    }else if(accessToken&&refreshToken&&type==="recovery"){
     const result=await supabase.auth.setSession({access_token:accessToken,refresh_token:refreshToken});authError=result.error;
    }else if(tokenHash&&type==="recovery"){
     const result=await supabase.auth.verifyOtp({token_hash:tokenHash,type:"recovery"});authError=result.error;
    }
    if(authError)throw authError;
    verified=true;
    if(active){setLinkValid(true);setReady(true);setError("")}
   }catch(cause){
    if(active){setError(cause instanceof Error?cause.message:"Could not verify the reset link. Request a new link.");setReady(true)}
   }
  };
  void Linking.getInitialURL().then(acceptLink).catch(()=>acceptLink(null));
  const subscription=Linking.addEventListener("url",event=>{void acceptLink(event.url)});
  return()=>{active=false;subscription.remove()};
 },[routeCode,routeAccessToken,routeRefreshToken,routeType,routeTokenHash]);
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
