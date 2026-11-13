import type {PropsWithChildren} from "react";
import {ActivityIndicator,Pressable,StyleSheet,Text,View,type PressableProps} from "react-native";
import {theme} from "@/lib/theme";
export function Heading({children}:PropsWithChildren){return <Text style={s.heading}>{children}</Text>}
export function Subheading({children}:PropsWithChildren){return <Text style={s.sub}>{children}</Text>}
export function Muted({children}:PropsWithChildren){return <Text style={s.muted}>{children}</Text>}
export function Card({children}:PropsWithChildren){return <View style={s.card}>{children}</View>}
export function Button({children,loading,disabled,...props}:PressableProps&{children:string;loading?:boolean}){return <Pressable accessibilityRole="button" disabled={disabled||loading} style={({pressed})=>[s.button,(pressed||disabled||loading)&&{opacity:.65}]} {...props}>{loading?<ActivityIndicator color="#fff"/>:<Text style={s.buttonText}>{children}</Text>}</Pressable>}
const s=StyleSheet.create({heading:{color:theme.text,fontSize:29,fontWeight:"900",letterSpacing:-.8},sub:{color:theme.text,fontSize:18,fontWeight:"800"},muted:{color:theme.muted,fontSize:13,lineHeight:20},card:{backgroundColor:theme.surface,borderColor:theme.border,borderWidth:1,borderRadius:theme.radius,padding:16,gap:9},button:{backgroundColor:theme.accent,borderRadius:13,padding:15,alignItems:"center",justifyContent:"center"},buttonText:{color:"#fff",fontWeight:"800",fontSize:15}});
