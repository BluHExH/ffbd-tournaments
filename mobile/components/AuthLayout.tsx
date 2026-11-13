import type {PropsWithChildren} from "react";
import {Image,ImageBackground,Pressable,StyleSheet,Text,View} from "react-native";
import {router} from "expo-router";
import {Screen} from "@/components/Screen";
import {BRAND} from "@/lib/brand";
import {theme} from "@/lib/theme";

type Props=PropsWithChildren<{eyebrow:string;title:string;description:string;footer:string;footerAction:string;onFooterPress:()=>void}>;

export function AuthLayout({children,eyebrow,title,description,footer,footerAction,onFooterPress}:Props){
  return <Screen>
    <View style={s.top}>
      <Pressable onPress={()=>router.canGoBack()?router.back():router.replace("/")} style={s.back}><Text style={s.backText}>‹</Text></Pressable>
      <View style={s.brand}>
        <Image source={{uri:BRAND.logo}} style={s.logo}/>
        <View><Text style={s.brandName}>BANGLAR</Text><Text style={s.brandSub}>TOURNAMENTS</Text></View>
      </View>
      <View style={s.topSpacer}/>
    </View>
    <ImageBackground source={{uri:BRAND.cover}} imageStyle={s.coverImage} style={s.hero}>
      <View style={s.heroShade}/>
      <View style={s.heroContent}>
        <View style={s.livePill}><View style={s.dot}/><Text style={s.pillText}>BANGLADESH ESPORTS COMMUNITY</Text></View>
        <Text style={s.heroTitle}>YOUR NEXT{ "\n" }VICTORY{ "\n" }STARTS HERE.</Text>
        <Text style={s.heroCopy}>One account. Every tournament. Your game, your glory.</Text>
      </View>
    </ImageBackground>
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
    <Text style={s.legal}>By continuing, you agree to play fair and follow tournament rules.</Text>
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
  top:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  back:{width:40,height:40,borderRadius:12,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(255,255,255,.06)",borderWidth:1,borderColor:theme.border},
  backText:{color:"#fff",fontSize:29,lineHeight:32,marginTop:-3},
  brand:{flexDirection:"row",alignItems:"center",gap:9},
  logo:{width:36,height:36,borderRadius:10,borderWidth:1,borderColor:theme.border},
  brandName:{color:"#fff",fontSize:13,fontWeight:"900",letterSpacing:1},
  brandSub:{color:theme.accent,fontSize:9,fontWeight:"900",letterSpacing:1.8},
  topSpacer:{width:40},
  hero:{height:205,borderRadius:18,overflow:"hidden",justifyContent:"flex-end",backgroundColor:theme.backgroundAlt},
  coverImage:{borderRadius:18,opacity:.85},
  heroShade:{...StyleSheet.absoluteFillObject,backgroundColor:"rgba(5,11,22,.72)"},
  heroContent:{padding:17,gap:9},
  livePill:{alignSelf:"flex-start",flexDirection:"row",alignItems:"center",gap:7,paddingHorizontal:9,paddingVertical:6,borderRadius:30,backgroundColor:"rgba(255,255,255,.12)"},
  dot:{width:6,height:6,borderRadius:5,backgroundColor:theme.green},
  pillText:{color:"#fff",fontSize:8,fontWeight:"900",letterSpacing:.8},
  heroTitle:{color:"#fff",fontSize:29,lineHeight:29,fontWeight:"900",letterSpacing:-.5},
  heroCopy:{color:"rgba(255,255,255,.75)",fontSize:11},
  formHead:{gap:5},
  eyebrow:{color:theme.accent,fontSize:10,fontWeight:"900",letterSpacing:1.7},
  title:{color:"#fff",fontSize:28,fontWeight:"900",letterSpacing:-.6},
  description:{color:theme.muted,fontSize:12,lineHeight:19},
  form:{backgroundColor:"rgba(26,35,50,.88)",borderColor:theme.border,borderWidth:1,borderRadius:17,padding:15,gap:13},
  footer:{flexDirection:"row",justifyContent:"center",alignItems:"center",flexWrap:"wrap",gap:5},
  footerText:{color:theme.muted,fontSize:12},
  footerAction:{color:theme.accent,fontSize:12,fontWeight:"900"},
  legal:{color:"#64748B",fontSize:10,textAlign:"center",lineHeight:16},
});