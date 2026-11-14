import type {PropsWithChildren} from "react";
import {Image,Pressable,StyleSheet,Text,View} from "react-native";
import {Screen} from "@/components/Screen";
import {BRAND} from "@/lib/brand";
import {theme} from "@/lib/theme";
import {LanguageSwitcher} from "@/lib/i18n";

type Props=PropsWithChildren<{eyebrow:string;title:string;description:string;footer:string;footerAction:string;onFooterPress:()=>void}>;
export function AuthLayout({children,eyebrow,title,description,footer,footerAction,onFooterPress}:Props){
 return <Screen>
  <View style={s.top}>
   <View style={s.brand}>
    <Image source={{uri:BRAND.logo}} style={s.logo}/>
    <View><Text style={s.brandName}>BANGLAR</Text><Text style={s.brandSub}>TOURNAMENTS</Text></View>
   </View>
   <LanguageSwitcher/>
  </View>
  <View style={s.formHead}>
   <Text style={s.eyebrow}>{eyebrow}</Text>
   <Text style={s.title}>{title}</Text>
   <Text style={s.description}>{description}</Text>
  </View>
  <View style={s.form}>{children}</View>
  <View style={s.footer}>
   <Text style={s.footerText}>{footer}</Text>
   <Pressable onPress={onFooterPress}><Text style={s.footerAction}>{footerAction} →</Text></Pressable>
  </View>
 </Screen>;
}
export const authStyles=StyleSheet.create({
 fieldLabel:{color:"#CBD5E1",fontSize:11,fontWeight:"900",letterSpacing:1,marginBottom:7},
 input:{minHeight:52,backgroundColor:"#101A2A",color:"#F8FAFC",borderWidth:1,borderColor:"rgba(255,255,255,.12)",borderRadius:12,paddingHorizontal:14,fontSize:14},
 inputError:{borderColor:theme.red},
 helper:{color:theme.muted,fontSize:11,lineHeight:17},
 link:{color:theme.accent,fontSize:12,fontWeight:"900"},
 error:{color:"#FCA5A5",fontSize:12,lineHeight:18,backgroundColor:"rgba(239,68,68,.10)",borderWidth:1,borderColor:"rgba(239,68,68,.25)",padding:11,borderRadius:10},
 success:{color:"#86EFAC",fontSize:12,lineHeight:18,backgroundColor:"rgba(34,197,94,.10)",borderWidth:1,borderColor:"rgba(34,197,94,.25)",padding:11,borderRadius:10},
});
const s=StyleSheet.create({
 top:{minHeight:68,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12},
 brand:{flexDirection:"row",alignItems:"center",gap:10},
 logo:{width:42,height:42,borderRadius:12,borderWidth:1,borderColor:theme.border},
 brandName:{color:"#fff",fontSize:14,fontWeight:"900",letterSpacing:1},
 brandSub:{color:theme.accent,fontSize:9,fontWeight:"900",letterSpacing:1.8},
 formHead:{gap:6,marginTop:24},
 eyebrow:{color:theme.accent,fontSize:10,fontWeight:"900",letterSpacing:1.7},
 title:{color:"#fff",fontSize:28,fontWeight:"900",letterSpacing:-.6},
 description:{color:theme.muted,fontSize:12,lineHeight:19},
 form:{backgroundColor:"rgba(26,35,50,.88)",borderColor:theme.border,borderWidth:1,borderRadius:17,padding:15,gap:13},
 footer:{flexDirection:"row",justifyContent:"center",alignItems:"center",flexWrap:"wrap",gap:5,paddingVertical:12},
 footerText:{color:theme.muted,fontSize:12},
 footerAction:{color:theme.accent,fontSize:12,fontWeight:"900"},
});
