import {Stack} from "expo-router";

export default function TournamentStack(){
  return <Stack screenOptions={{headerShown:false,animation:"slide_from_right",gestureEnabled:true}} />;
}
