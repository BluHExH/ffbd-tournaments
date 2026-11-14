import {Tabs} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {theme} from "@/lib/theme";
import {useLanguage} from "@/lib/i18n";
export default function TabLayout(){
 const {t}=useLanguage();
 return <Tabs screenOptions={{headerShown:false,tabBarStyle:{backgroundColor:"#0B1221",borderTopColor:"rgba(255,255,255,.10)",borderTopWidth:1,height:68,paddingTop:8,paddingBottom:9,elevation:16},tabBarActiveTintColor:theme.accent,tabBarInactiveTintColor:"#718096",tabBarLabelStyle:{fontSize:10,fontWeight:"800",letterSpacing:.2}}}>
  <Tabs.Screen name="index" options={{title:t("nav.home"),tabBarIcon:({color,size})=><Ionicons name="home" color={color} size={size}/>}}/>
  <Tabs.Screen name="tournaments" options={{title:t("nav.tournaments"),tabBarIcon:({color,size})=><Ionicons name="trophy" color={color} size={size}/>}}/>
  <Tabs.Screen name="my-match" options={{href:null}}/>
  <Tabs.Screen name="results" options={{title:t("nav.results"),tabBarIcon:({color,size})=><Ionicons name="podium" color={color} size={size}/>}}/>
  <Tabs.Screen name="wallet" options={{title:t("nav.wallet"),tabBarIcon:({color,size})=><Ionicons name="wallet" color={color} size={size}/>}}/>
  <Tabs.Screen name="account" options={{title:t("nav.profile"),tabBarIcon:({color,size})=><Ionicons name="person-circle" color={color} size={size}/>}}/>
 </Tabs>;
}
