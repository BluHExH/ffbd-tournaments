import {useState} from "react";
import {Pressable,Text,TextInput,View} from "react-native";
import {router} from "expo-router";
import {Button} from "@/components/UI";
import {AuthLayout,authStyles as s} from "@/components/AuthLayout";
import {supabase} from "@/lib/supabase";

export default function Register(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const submit=async()=>{
    setError("");setSuccess("");
    if(!supabase){setError("App connection is not configured yet. Please contact the tournament team.");return}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setError("Enter a valid email address.");return}
    if(password.length<8){setError("Your password must contain at least 8 characters.");return}
    if(password!==confirm){setError("Your passwords do not match.");return}
    setBusy(true);
    try{
      const {data,error}=await supabase.auth.signUp({email:email.trim(),password});
      if(error){setError(error.message);return}
      if(data.session){router.replace("/(tabs)/account");return}
      setSuccess("Your account has been created. Check your email for the confirmation link, then sign in.");
    }catch{setError("Something went wrong. Check your connection and try again.");}
    finally{setBusy(false)}
  };
  return <AuthLayout eyebrow="JOIN THE COMMUNITY" title="Create your player ID." description="Create one account to explore tournaments and manage your player profile." footer="Already registered?" footerAction="Sign in" onFooterPress={()=>router.replace("/login")}>
    <View style={{gap:7}}><Text style={s.fieldLabel}>EMAIL ADDRESS</Text><TextInput value={email} onChangeText={v=>{setEmail(v);setError("");setSuccess("")}} placeholder="you@example.com" placeholderTextColor="#64748B" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" style={s.input}/></View>
    <View style={{gap:7}}><Text style={s.fieldLabel}>PASSWORD</Text><View style={{position:"relative",justifyContent:"center"}}><TextInput value={password} onChangeText={v=>{setPassword(v);setError("");setSuccess("")}} placeholder="At least 8 characters" placeholderTextColor="#64748B" secureTextEntry={!showPassword} textContentType="newPassword" autoComplete="new-password" style={[s.input,{paddingRight:76}]}/><Pressable onPress={()=>setShowPassword(v=>!v)} style={{position:"absolute",right:13,padding:6}}><Text style={s.link}>{showPassword?"HIDE":"SHOW"}</Text></Pressable></View></View>
    <View style={{gap:7}}><Text style={s.fieldLabel}>CONFIRM PASSWORD</Text><TextInput value={confirm} onChangeText={v=>{setConfirm(v);setError("");setSuccess("")}} placeholder="Enter your password again" placeholderTextColor="#64748B" secureTextEntry={!showPassword} textContentType="newPassword" style={s.input} onSubmitEditing={submit}/></View>
    {error?<Text accessibilityRole="alert" style={s.error}>{error}</Text>:null}
    {success?<Text accessibilityRole="alert" style={s.success}>{success}</Text>:null}
    <Button loading={busy} onPress={submit}>CREATE MY ACCOUNT</Button>
    <Text style={s.helper}>Use an email address you can access. Email verification may be required.</Text>
  </AuthLayout>;
}