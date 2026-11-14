import {useState} from "react";
import {Pressable,Text,TextInput,View} from "react-native";
import {router} from "expo-router";
import {Button} from "@/components/UI";
import {AuthLayout,authStyles as s} from "@/components/AuthLayout";
import {supabase} from "@/lib/supabase";
import {useLanguage} from "@/lib/i18n";

export default function Login(){
 const {t}=useLanguage();
 const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [showPassword,setShowPassword]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const submit=async()=>{
  setError("");
  if(!supabase){setError("App connection is not configured yet. Please contact the tournament team.");return}
  if(!email.trim()||!password){setError("Enter your email address and password.");return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setError("Enter a valid email address.");return}
  setBusy(true);
  try{const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error){setError(error.message==="Invalid login credentials"?"Email or password is incorrect. Please try again.":error.message);return}router.replace("/(tabs)")}
  catch{setError("Something went wrong. Check your connection and try again.");}
  finally{setBusy(false)}
 };
 return <AuthLayout eyebrow={t("auth.login").toUpperCase()} title={t("auth.welcome")} description={t("auth.loginDescription")} footer={t("auth.newPlayer")} footerAction={t("auth.register")} onFooterPress={()=>router.push("/register")}>
  <View style={{gap:7}}><Text style={s.fieldLabel}>{t("auth.email").toUpperCase()}</Text><TextInput value={email} onChangeText={v=>{setEmail(v);setError("")}} placeholder={t("auth.emailPlaceholder")} placeholderTextColor="#64748B" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" style={s.input} returnKeyType="next"/></View>
  <View style={{gap:7}}><Text style={s.fieldLabel}>{t("auth.password").toUpperCase()}</Text><View style={{position:"relative",justifyContent:"center"}}><TextInput value={password} onChangeText={v=>{setPassword(v);setError("")}} placeholder={t("auth.passwordPlaceholder")} placeholderTextColor="#64748B" secureTextEntry={!showPassword} textContentType="password" autoComplete="current-password" onSubmitEditing={submit} style={[s.input,{paddingRight:76}]}/><Pressable onPress={()=>setShowPassword(v=>!v)} style={{position:"absolute",right:13,padding:6}}><Text style={s.link}>{showPassword?t("auth.hide"):t("auth.show")}</Text></Pressable></View></View>
  <View style={{alignItems:"flex-end",marginTop:-3}}><Pressable onPress={()=>router.push("/forgot-password")}><Text style={s.link}>{t("auth.forgot")}</Text></Pressable></View>
  {error?<Text accessibilityRole="alert" style={s.error}>{error}</Text>:null}
  <Button loading={busy} onPress={submit}>{t("auth.signIn").toUpperCase()}</Button>
 </AuthLayout>;
}
