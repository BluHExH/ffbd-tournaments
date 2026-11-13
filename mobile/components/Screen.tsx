import type {PropsWithChildren} from "react";
import {ScrollView,StyleSheet} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {theme} from "@/lib/theme";
export function Screen({children}:PropsWithChildren){return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>{children}</ScrollView></SafeAreaView>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:theme.background},content:{padding:20,gap:16,flexGrow:1}});
