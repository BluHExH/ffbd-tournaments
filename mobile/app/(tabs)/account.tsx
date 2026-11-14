import {useEffect,useState} from "react";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {Pressable,StyleSheet,Text,View} from "react-native";
import {Button,Card,Heading,Muted,Subheading} from "@/components/UI";
import {Screen} from "@/components/Screen";
import {supabase} from "@/lib/supabase";
import {theme} from "@/lib/theme";
import {LanguageSwitcher,useLanguage} from "@/lib/i18n";

type MenuItem={label:string;icon:keyof typeof Ionicons.glyphMap;section:string;description?:string};
function MenuRow({item}:{item:MenuItem}){
 return <Pressable accessibilityRole="button" onPress={()=>router.push(item.section==="wallet"?"/(tabs)/wallet":({pathname:"/profile/[section]",params:{section:item.section}} as never))} style={({pressed})=>[styles.menuRow,pressed&&styles.pressed]}>
  <View style={styles.iconBox}><Ionicons name={item.icon} size={20} color={theme.accent}/></View>
  <View style={styles.menuCopy}><Text style={styles.menuTitle}>{item.label}</Text>{item.description?<Text style={styles.menuDescription}>{item.description}</Text>:null}</View>
  <Ionicons name="chevron-forward" size={18} color={theme.muted}/>
 </Pressable>;
}
export default function Account(){
 const {t}=useLanguage();const [email,setEmail]=useState<string|null>(null);const [admin,setAdmin]=useState(false);
 useEffect(()=>{
  if(!supabase)return;let active=true;
  const load=async()=>{const {data}=await supabase!.auth.getUser();if(!active)return;setEmail(data.user?.email??null);if(data.user){const {data:row}=await supabase!.from("admins").select("id").eq("id",data.user.id).maybeSingle();if(active)setAdmin(Boolean(row))}else if(active)setAdmin(false)};
  void load();const {data:sub}=supabase.auth.onAuthStateChange(()=>{void load()});return()=>{active=false;sub.subscription.unsubscribe()};
 },[]);
 const logout=async()=>{await supabase?.auth.signOut();setEmail(null);setAdmin(false)};
 const groups:{title:string;items:MenuItem[]}[]=[
  {title:t("profile.walletPayments").toUpperCase(),items:[
   {label:t("nav.wallet"),icon:"wallet-outline",section:"wallet",description:t("profile.walletDesc")},
   {label:t("profile.addMoney"),icon:"add-circle-outline",section:"wallet",description:t("profile.addDesc")},
   {label:t("profile.withdraw"),icon:"cash-outline",section:"wallet",description:t("profile.withdrawDesc")},
   {label:t("profile.transactions"),icon:"receipt-outline",section:"wallet",description:t("profile.transactionsDesc")},
  ]},
  {title:t("profile.player").toUpperCase(),items:[
   {label:t("profile.myProfile"),icon:"person-outline",section:"my-profile",description:t("profile.profileDesc")},
   {label:t("profile.myMatch"),icon:"game-controller-outline",section:"my-match",description:t("profile.matchDesc")},
   {label:t("profile.results"),icon:"trophy-outline",section:"results",description:t("profile.resultsDesc")},
  ]},
  {title:t("profile.community").toUpperCase(),items:[
   {label:t("profile.topPlayers"),icon:"podium-outline",section:"top-players",description:t("profile.topDesc")},
   {label:t("profile.rules"),icon:"document-text-outline",section:"rules",description:t("profile.rulesDesc")},
   {label:t("profile.developer"),icon:"code-slash-outline",section:"developer",description:t("profile.developerDesc")},
   {label:t("profile.notifications"),icon:"notifications-outline",section:"notifications",description:t("profile.noticeDesc")},
  ]}
 ];
 return <Screen>
  <Muted>{t("profile.playerAccount").toUpperCase()}</Muted><Heading>{t("profile.title")}</Heading>
  <Card><View style={styles.profileTop}><View style={styles.avatar}><Ionicons name="person" size={27} color={theme.accent}/></View><View style={styles.profileCopy}><Subheading>{email?t("profile.signedIn"):t("profile.welcome")}</Subheading><Muted>{email??t("profile.signInHint")}</Muted></View></View>
   {email?<View style={styles.accountActions}>{admin?<Button onPress={()=>router.push("/admin")}>{t("profile.admin")}</Button>:null}<Button onPress={logout}>{t("profile.signOut")}</Button></View>:<View style={styles.accountActions}><Button onPress={()=>router.push("/login")}>{t("profile.login")}</Button><Button onPress={()=>router.push("/register")}>{t("profile.create")}</Button></View>}
  </Card>
  <Card><LanguageSwitcher/></Card>
  {groups.map(group=><View key={group.title} style={styles.group}><Text style={styles.groupTitle}>{group.title}</Text><Card>{group.items.map(item=><MenuRow key={item.label} item={item}/>)}</Card></View>)}
 </Screen>;
}
const styles=StyleSheet.create({
 profileTop:{flexDirection:"row",alignItems:"center",gap:13},avatar:{width:54,height:54,borderRadius:27,backgroundColor:"rgba(255,92,0,.13)",borderWidth:1,borderColor:"rgba(255,92,0,.35)",alignItems:"center",justifyContent:"center"},
 profileCopy:{flex:1,gap:3},accountActions:{gap:9,marginTop:12},group:{gap:9},groupTitle:{color:theme.accent,fontSize:11,fontWeight:"900",letterSpacing:1.4},
 menuRow:{minHeight:66,flexDirection:"row",alignItems:"center",gap:12,paddingVertical:10,borderBottomWidth:1,borderBottomColor:theme.border},pressed:{opacity:.65},
 iconBox:{width:38,height:38,borderRadius:12,backgroundColor:"rgba(255,255,255,.05)",alignItems:"center",justifyContent:"center"},menuCopy:{flex:1,gap:2},menuTitle:{color:theme.text,fontSize:14,fontWeight:"800"},menuDescription:{color:theme.muted,fontSize:11,lineHeight:15}
});
