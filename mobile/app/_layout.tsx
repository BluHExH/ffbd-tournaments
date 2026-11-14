import {useEffect,useState,type PropsWithChildren} from "react";
import {Stack,useRouter,useSegments} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {theme} from "@/lib/theme";
import {supabase} from "@/lib/supabase";
import {LanguageProvider} from "@/lib/i18n";

function AuthGate({children}:PropsWithChildren){
 const [hasSession,setHasSession]=useState<boolean|null>(null);
 const router=useRouter();
 const segments=useSegments();
 useEffect(()=>{
  if(!supabase){setHasSession(false);return}
  let active=true;
  void supabase.auth.getSession().then(({data})=>{if(active)setHasSession(Boolean(data.session))});
  const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{if(active)setHasSession(Boolean(session))});
  return()=>{active=false;listener.subscription.unsubscribe()};
 },[]);
 useEffect(()=>{
  if(hasSession===null)return;
  const first=segments[0] as string|undefined;
  const authRoute=first==="login"||first==="register"||first==="forgot-password";
  if(hasSession&&(!first||first==="index"||authRoute)){router.replace("/(tabs)");return}
  if(!hasSession&&!authRoute)router.replace("/login");
 },[hasSession,segments,router]);
 if(hasSession===null)return null;
 const first=segments[0] as string|undefined;
 const authRoute=first==="login"||first==="register"||first==="forgot-password";
 if((hasSession&&authRoute)||(!hasSession&&!authRoute))return null;
 return <>{children}</>;
}

export default function RootLayout(){
 return <LanguageProvider><SafeAreaProvider>
  <StatusBar style="light"/>
  <AuthGate>
   <Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:theme.background},animation:"fade"}}>
    <Stack.Screen name="index"/>
    <Stack.Screen name="(tabs)"/>
    <Stack.Screen name="login"/>
    <Stack.Screen name="register"/>
    <Stack.Screen name="forgot-password"/>
    <Stack.Screen name="admin"/>
   </Stack>
  </AuthGate>
 </SafeAreaProvider></LanguageProvider>;
}
