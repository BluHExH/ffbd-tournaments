import {useState} from "react";
import {Pressable,Text,TextInput,View} from "react-native";
import {router} from "expo-router";
import {Button} from "@/components/UI";
import {AuthLayout,authStyles as s} from "@/components/AuthLayout";
import {supabase} from "@/lib/supabase";

export default function Login(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const submit=async()=>{
    setError("");
    if(!supabase){setError("App connection is not configured yet. Please contact the tournament team.");return}
    if(!email.trim()||!password){setError("Enter your email address and password.");return}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setError("Enter a valid email address.");return}
    setBusy(true);
    try{
      const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
      if(error){setError(error.message==="Invalid login credentials"?"Email or password is incorrect. Please try again.":error.message);return}
      router.replace("/(tabs)/account");
    }catch{setError("Something went wrong. Check your connection and try again.");}
    finally{setBusy(false)}
  };
  return <AuthLayout eyebrow="PLAYER ACCESS" title="Welcome back." description="Sign in with the same account you use on the Banglar Tournaments website." footer="New to the arena?" footerAction="Create account" onFooterPress={()=>router.push("/register")}>
    <View style={{gap:7}}><Text style={s.fieldLabel}>EMAIL ADDRESS</Text><TextInput value={email} onChangeText={v=>{setEmail(v);setError("")}} placeholder="you@example.com" placeholderTextColor="#64748B" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" style={s.input} returnKeyType="next"/></View>
    <View style={{gap:7}}><Text style={s.fieldLabel}>PASSWORD</Text><View style={{position:"relative",justifyContent:"center"}}><TextInput value={password} onChangeText={v=>{setPassword(v);setError("")}} placeholder="Enter your password" placeholderTextColor="#64748B" secureTextEntry={!showPassword} textContentType="password" onSubmitEditing={submit} style={[s.input,{paddingRight:76}]}/><Pressable onPress={()=>setShowPassword(v=>!v)} style={{position:"absolute",right:13,padding:6}}><Text style={s.link}>{showPassword?"HIDE":"SHOW"}</Text></Pressable></View></View>
    <View style={{alignItems:"flex-end",marginTop:-3}}><Pressable onPress={()=>router.push("/forgot-password")}><Text style={s.link}>Forgot password?</Text></Pressable></View>
    {error?<Text accessibilityRole="alert" style={s.error}>{error}</Text>:null}
    <Button loading={busy} onPress={submit}>SIGN IN TO YOUR ACCOUNT</Button>
    <Text style={s.helper}>Your website account works here too. No need to register again.</Text>
  </AuthLayout>;
}