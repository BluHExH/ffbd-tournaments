import {useState} from "react";
import {Pressable,Text,TextInput,View} from "react-native";
import {router} from "expo-router";
import {Button} from "@/components/UI";
import {AuthLayout,authStyles as s} from "@/components/AuthLayout";
import {supabase} from "@/lib/supabase";
import {useLanguage} from "@/lib/i18n";

export default function Register(){
 const {t}=useLanguage();
 const [username,setUsername]=useState("");const [email,setEmail]=useState("");const [phone,setPhone]=useState("");const [password,setPassword]=useState("");const [confirm,setConfirm]=useState("");const [showPassword,setShowPassword]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [success,setSuccess]=useState("");
 const submit=async()=>{
  setError("");setSuccess("");
  if(!supabase){setError("App connection is not configured yet. Please contact the tournament team.");return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setError("Enter a valid email address.");return}
  if(!/^\\+?[0-9\\s()-]{8,20}$/.test(phone.trim())){setError("Enter a valid phone number.");return}\n  if(password.length<8){setError("Your password must contain at least 8 characters.");return}
  if(password!==confirm){setError("Your passwords do not match.");return}
  setBusy(true);
  try{const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{username:username.trim(),phone_number:phone.trim()}}});if(error){setError(error.message);return}if(data.session){router.replace("/(tabs)/account");return}setSuccess("Your account has been created. Check your email for the confirmation link, then sign in.");}
  catch{setError("Something went wrong. Check your connection and try again.");}
  finally{setBusy(false)}
 };
 return <AuthLayout eyebrow={t("auth.register").toUpperCase()} title={t("auth.registerTitle")} description={t("auth.registerDescription")} footer={t("auth.already")} footerAction={t("auth.login")} onFooterPress={()=>router.replace("/login")}>
  <View style={{gap:7}}><Text style={s.fieldLabel}>PLAYER USERNAME</Text><TextInput value={username} onChangeText={v=>{setUsername(v);setError("");setSuccess("")}} placeholder="Choose your player name" placeholderTextColor="#64748B" autoCapitalize="none" autoCorrect={false} textContentType="username" autoComplete="username" style={s.input}/></View>\n  <View style={{gap:7}}><Text style={s.fieldLabel}>{t("auth.email").toUpperCase()}</Text><TextInput value={email} onChangeText={v=>{setEmail(v);setError("");setSuccess("")}} placeholder={t("auth.emailPlaceholder")} placeholderTextColor="#64748B" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" style={s.input}/></View>
  <View style={{gap:7}}><Text style={s.fieldLabel}>PHONE NUMBER</Text><TextInput value={phone} onChangeText={v=>{setPhone(v);setError("");setSuccess("")}} placeholder="+8801XXXXXXXXX" placeholderTextColor="#64748B" autoCapitalize="none" keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel" style={s.input}/></View>\n  <View style={{gap:7}}><Text style={s.fieldLabel}>{t("auth.password").toUpperCase()}</Text><View style={{position:"relative",justifyContent:"center"}}><TextInput value={password} onChangeText={v=>{setPassword(v);setError("");setSuccess("")}} placeholder={t("auth.passwordHint")} placeholderTextColor="#64748B" secureTextEntry={!showPassword} textContentType="newPassword" autoComplete="new-password" style={[s.input,{paddingRight:76}]}/><Pressable onPress={()=>setShowPassword(v=>!v)} style={{position:"absolute",right:13,padding:6}}><Text style={s.link}>{showPassword?t("auth.hide"):t("auth.show")}</Text></Pressable></View></View>
  <View style={{gap:7}}><Text style={s.fieldLabel}>{t("auth.confirmPassword").toUpperCase()}</Text><TextInput value={confirm} onChangeText={v=>{setConfirm(v);setError("");setSuccess("")}} placeholder={t("auth.confirmPassword")} placeholderTextColor="#64748B" secureTextEntry={!showPassword} textContentType="newPassword" style={s.input} onSubmitEditing={submit}/></View>
  {error?<Text accessibilityRole="alert" style={s.error}>{error}</Text>:null}
  {success?<Text accessibilityRole="alert" style={s.success}>{success}</Text>:null}
  <Button loading={busy} onPress={submit}>{t("auth.create").toUpperCase()}</Button>
 </AuthLayout>;
}
