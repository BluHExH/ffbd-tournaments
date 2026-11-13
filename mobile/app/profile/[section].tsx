import {router,useLocalSearchParams} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {Pressable,StyleSheet,Text,View} from "react-native";
import {Card,Heading,Muted,Subheading} from "@/components/UI";
import {Screen} from "@/components/Screen";
import {theme} from "@/lib/theme";

const sections:Record<string,{title:string;description:string;icon:keyof typeof Ionicons.glyphMap;next:string}>={
 "my-profile":{title:"My Profile",description:"Your username, email, phone number and password settings will be managed here.",icon:"person-outline",next:"Profile details and secure account editing are the next implementation step."},
 "my-match":{title:"My Match",description:"Joined, upcoming and live tournament matches.",icon:"game-controller-outline",next:"Match data will be connected to the shared tournament database."},
 results:{title:"Results",description:"Tournament results, winners, kills, points and player rankings.",icon:"trophy-outline",next:"Results will be connected after match participation data is available."},
 "top-players":{title:"Top Players",description:"Leaderboard for the top 20 tournament players.",icon:"podium-outline",next:"Leaderboard calculations and verified player statistics are not connected yet."},
 rules:{title:"All Rules",description:"Tournament participation, payment and platform rules.",icon:"document-text-outline",next:"Rules content will be connected to the website's shared settings."},
 developer:{title:"Developer Profile",description:"Information about the BANGLAR TOURNAMENTS developer.",icon:"code-slash-outline",next:"Developer information and links will be added in a later step."},
 notifications:{title:"Notifications",description:"Important tournament and account updates.",icon:"notifications-outline",next:"Push notification delivery and notification history are not connected yet."}
};
export default function ProfileSection(){
 const {section}=useLocalSearchParams<{section:string}>();
 const item=sections[section??""];
 if(!item)return <Screen><Pressable onPress={()=>router.back()} style={s.back}><Ionicons name="arrow-back" size={20} color={theme.text}/><Text style={s.backText}>Back to Profile</Text></Pressable><Heading>Section not found</Heading></Screen>;
 return <Screen>
  <Pressable onPress={()=>router.back()} style={s.back}><Ionicons name="arrow-back" size={20} color={theme.text}/><Text style={s.backText}>Back to Profile</Text></Pressable>
  <View style={s.headingRow}><View style={s.icon}><Ionicons name={item.icon} size={25} color={theme.accent}/></View><View style={s.headingCopy}><Muted>PLAYER PROFILE</Muted><Heading>{item.title}</Heading></View></View>
  <Card><Subheading>{item.description}</Subheading><Muted>{item.next}</Muted></Card>
  <Card><Muted>DEVELOPMENT STATUS</Muted><Text style={s.status}>This section is being built in stages.</Text><Muted>It is not marked complete until its data and actions are implemented and tested in the app.</Muted></Card>
 </Screen>;
}
const s=StyleSheet.create({back:{flexDirection:"row",alignItems:"center",gap:8,alignSelf:"flex-start",paddingVertical:8},backText:{color:theme.text,fontWeight:"800"},headingRow:{flexDirection:"row",alignItems:"center",gap:12},icon:{width:52,height:52,borderRadius:15,backgroundColor:"rgba(255,92,0,.13)",alignItems:"center",justifyContent:"center"},headingCopy:{flex:1,gap:2},status:{color:theme.accent,fontSize:15,fontWeight:"900"}});
