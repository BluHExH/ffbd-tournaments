import {useState} from "react";
import {Text,TextInput,View} from "react-native";
import {router} from "expo-router";
import {Button} from "@/components/UI";
import {AuthLayout,authStyles as s} from "@/components/AuthLayout";
import {supabase} from "@/lib/supabase";

export default function ForgotPassword(){
  const [email,setEmail]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const submit=async()=>{
    setError("");setSuccess("");
    if(!supabase){setError("App connection is not configured yet. Please contact the tournament team.");return}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setError("Enter the email address linked to your account.");return}
    setBusy(true);
    try{
      const {error}=await supabase.auth.resetPasswordForEmail(email.trim());
      if(error){setError(error.message);return}
      setSuccess("If an account exists for this email, a password reset link has been sent. Check your inbox and spam folder.");
    }catch{setError("Unable to send the reset email right now. Please try again.");}
    finally{setBusy(false)}
  };
  return <AuthLayout eyebrow="ACCOUNT RECOVERY" title="Forgot your password?" description="Enter the email address linked to your player account. We will send you a reset link." footer="Remembered your password?" footerAction="Back to sign in" onFooterPress={()=>router.replace("/login")}>
    <View style={{gap:7}}><Text style={s.fieldLabel}>EMAIL ADDRESS</Text><TextInput value={email} onChangeText={v=>{setEmail(v);setError("");setSuccess("")}} placeholder="you@example.com" placeholderTextColor="#64748B" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" style={s.input} onSubmitEditing={submit}/></View>
    {error?<Text accessibilityRole="alert" style={s.error}>{error}</Text>:null}
    {success?<Text accessibilityRole="alert" style={s.success}>{success}</Text>:null}
    <Button loading={busy} onPress={submit}>SEND RESET LINK</Button>
    <Text style={s.helper}>For security, we do not reveal whether an email address is registered.</Text>
  </AuthLayout>;
}