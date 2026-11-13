import {useEffect,useState} from "react";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {Pressable,StyleSheet,Text,View} from "react-native";
import {Button,Card,Heading,Muted,Subheading} from "@/components/UI";
import {Screen} from "@/components/Screen";
import {supabase,hasSupabaseConfig} from "@/lib/supabase";
import {theme} from "@/lib/theme";

type MenuItem={label:string;icon:keyof typeof Ionicons.glyphMap;section:string;description?:string};
const groups:{title:string;items:MenuItem[]}[]=[
 {title:"WALLET & PAYMENTS",items:[
  {label:"Add Money",icon:"add-circle-outline",section:"wallet",description:"Add funds to your wallet"},
  {label:"Withdraw",icon:"cash-outline",section:"wallet",description:"Request a withdrawal"},
  {label:"Transaction History",icon:"receipt-outline",section:"wallet",description:"View deposits and payments"},
 ]},
 {title:"PLAYER ACCOUNT",items:[
  {label:"My Profile",icon:"person-outline",section:"my-profile",description:"Personal details and account settings"},
  {label:"My Match",icon:"game-controller-outline",section:"my-match",description:"Your joined and upcoming matches"},
  {label:"Results",icon:"trophy-outline",section:"results",description:"Tournament results and performance"},
 ]},
 {title:"COMMUNITY & SUPPORT",items:[
  {label:"Top Players",icon:"podium-outline",section:"top-players",description:"Leaderboard and player rankings"},
  {label:"All Rules",icon:"document-text-outline",section:"rules",description:"Tournament and platform rules"},
  {label:"Developer Profile",icon:"code-slash-outline",section:"developer",description:"About the app developer"},
  {label:"Notifications",icon:"notifications-outline",section:"notifications",description:"Your account updates"},
 ]}
];
function MenuRow({item}:{item:MenuItem}){
 return <Pressable accessibilityRole="button" onPress={()=>router.push(item.section==="wallet"?"/(tabs)/wallet":({pathname:"/profile/[section]",params:{section:item.section}} as never))} style={({pressed})=>[styles.menuRow,pressed&&styles.pressed]}>
  <View style={styles.iconBox}><Ionicons name={item.icon} size={20} color={theme.accent}/></View>
  <View style={styles.menuCopy}><Text style={styles.menuTitle}>{item.label}</Text>{item.description?<Text style={styles.menuDescription}>{item.description}</Text>:null}</View>
  <Ionicons name="chevron-forward" size={18} color={theme.muted}/>
 </Pressable>;
}
export default function Account(){
 const [email,setEmail]=useState<string|null>(null);
 const [admin,setAdmin]=useState(false);
 useEffect(()=>{
  if(!supabase)return;
  let active=true;
  const load=async()=>{
   const {data}=await supabase!.auth.getUser();
   if(!active)return;
   setEmail(data.user?.email??null);
   if(data.user){
    const {data:row}=await supabase!.from("admins").select("id").eq("id",data.user.id).maybeSingle();
    if(active)setAdmin(Boolean(row));
   }else if(active)setAdmin(false);
  };
  void load();
  const {data:sub}=supabase.auth.onAuthStateChange(()=>{void load()});
  return()=>{active=false;sub.subscription.unsubscribe()};
 },[]);
 const logout=async()=>{await supabase?.auth.signOut();setEmail(null);setAdmin(false)};
 return <Screen>
  <Muted>PLAYER PROFILE</Muted>
  <Heading>Profile</Heading>
  <Card>
   <View style={styles.profileTop}>
    <View style={styles.avatar}><Ionicons name="person" size={27} color={theme.accent}/></View>
    <View style={styles.profileCopy}>
     <Subheading>{email?"Player Account":"Welcome, Player"}</Subheading>
     <Muted>{email??"Sign in to access your player account and tournament services."}</Muted>
    </View>
   </View>
   {!hasSupabaseConfig?<Muted>Mobile Supabase setup is required before account features can be used.</Muted>:email?<><View style={styles.accountActions}>{admin?<Button onPress={()=>router.push("/admin")}>Open admin dashboard</Button>:null}<Button onPress={logout}>Sign out</Button></View></>:<View style={styles.accountActions}><Button onPress={()=>router.push("/login")}>Login</Button><Button onPress={()=>router.push("/register")}>Create account</Button></View>}
  </Card>
  {groups.map(group=><View key={group.title} style={styles.group}>
   <Text style={styles.groupTitle}>{group.title}</Text>
   <Card>{group.items.map(item=><MenuRow key={item.label} item={item}/>)}</Card>
  </View>)}
 </Screen>;
}
const styles=StyleSheet.create({
 profileTop:{flexDirection:"row",alignItems:"center",gap:13},
 avatar:{width:54,height:54,borderRadius:27,backgroundColor:"rgba(255,92,0,.13)",borderWidth:1,borderColor:"rgba(255,92,0,.35)",alignItems:"center",justifyContent:"center"},
 profileCopy:{flex:1,gap:3},
 accountActions:{gap:9,marginTop:5},
 group:{gap:9},
 groupTitle:{color:theme.accent,fontSize:11,fontWeight:"900",letterSpacing:1.4},
 menuRow:{minHeight:66,flexDirection:"row",alignItems:"center",gap:12,paddingVertical:10,borderBottomWidth:1,borderBottomColor:theme.border},
 pressed:{opacity:.65},
 iconBox:{width:38,height:38,borderRadius:12,backgroundColor:"rgba(255,255,255,.05)",alignItems:"center",justifyContent:"center"},
 menuCopy:{flex:1,gap:2},
 menuTitle:{color:theme.text,fontSize:14,fontWeight:"800"},
 menuDescription:{color:theme.muted,fontSize:11,lineHeight:15}
});