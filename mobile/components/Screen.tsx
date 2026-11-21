import type {PropsWithChildren} from "react";
import {useState} from "react";
import {RefreshControl,ScrollView,StyleSheet,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {theme} from "@/lib/theme";

type ScreenProps = PropsWithChildren<{ onRefresh?: () => Promise<void> | void }>;

export function Screen({children,onRefresh}:ScreenProps){
 const [refreshing,setRefreshing]=useState(false);
 const refresh=async()=>{
  if(!onRefresh||refreshing)return;
  setRefreshing(true);
  try{await onRefresh()}finally{setRefreshing(false)}
 };
 return <SafeAreaView style={s.safe}>
  <ScrollView
   showsVerticalScrollIndicator={false}
   contentContainerStyle={s.content}
   refreshControl={onRefresh?<RefreshControl refreshing={refreshing} onRefresh={()=>void refresh()} tintColor={theme.accent} colors={[theme.accent]} progressBackgroundColor="#121C2E"/>:undefined}
  >
   <View style={s.glow}/>
   {children}
  </ScrollView>
 </SafeAreaView>;
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:theme.background},
 content:{paddingHorizontal:16,paddingTop:10,paddingBottom:34,gap:18,flexGrow:1},
 glow:{position:"absolute",top:-140,right:-110,width:260,height:260,borderRadius:160,backgroundColor:"rgba(255,92,0,0.07)"}
});
