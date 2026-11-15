import {useEffect,useState} from "react";
import {ActivityIndicator,Linking,Text,TextInput,View} from "react-native";
import {router} from "expo-router";
import {Button} from "@/components/UI";
import {AuthLayout,authStyles as s} from "@/components/AuthLayout";
import {supabase} from "@/lib/supabase";
import {theme} from "@/lib/theme";

export default function ResetPassword(){
 const [ready,setReady]=useState(false);const [linkValid,setLinkValid]=useState(false);const [busy,setBusy]=useState(false);
 const [password,setPassword]=useState("");const [confirm,setConfirm]=useState("");
 const [error,setError]=useState("");const [success,setSuccess]=useState("");
 useEffect(()=>{
  let active=true;
  const acceptLink=async(url:string|null)=>{
   if(!supabase){if(active){setError("App connection is not configured.");setReady(true)}return}
   if(!url){if(active){setError("No reset link was received. Request a new password reset email.");setReady(true)}return}
   try{
    const parsed=new URL(url);
    const query=parsed.searchParams;
    const hash=new URLSearchParams(parsed.hash.replace(/^#/,""));
    const code=query.get("code");
    const accessToken=hash.get("access_token")||query.get("access_token");
    const refreshToken=hash.get("refresh_token")||query.get("refresh_token");
    const type=hash.get("type")||query.get("type");
    if(code){
     const {error}=await supabase.auth.exchangeCodeForSession(code);
     if(error)throw error;
    }else if(accessToken&&refreshToken&&type==="recovery"){
     const {error}=await supabase.auth.setSession({access_token:accessToken,refresh_token:refreshToken});
     if(error)throw error;
    }else{
     throw new Error("This password reset link is invalid or expired. Request a new link.");
    }
    if(active){setLinkValid(true);setReady(true)}
   }catch(cause){
    if(active){setError(cause instanceof Error?cause.message:"Could not verify the reset link.");setReady(true);}
   }
  };
  void Linking.getInitialURL().then(acceptLink);
  const subscription=Linking.addEventListener("url",event=>{void acceptLink(event.url)});
  return()=>{active=false;subscription.remove()};
 },[]);
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
