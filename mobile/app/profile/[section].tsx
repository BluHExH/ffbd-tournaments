import {useLocalSearchParams} from "expo-router";
import {Heading,Muted} from "@/components/UI";
import {Screen} from "@/components/Screen";
import {
  DeveloperSection,MyMatchesSection,NotificationsSection,PlayerProfileSection,
  ResultsSection,RulesSection,TopPlayersSection
} from "@/components/ProfileSections";

const sections:Record<string,()=>JSX.Element>={
  "my-profile":PlayerProfileSection,
  "my-match":MyMatchesSection,
  results:ResultsSection,
  "top-players":TopPlayersSection,
  rules:RulesSection,
  developer:DeveloperSection,
  notifications:NotificationsSection
};
export default function ProfileSection(){
  const {section}=useLocalSearchParams<{section:string}>();
  const Component=sections[section??""];
  if(!Component)return <Screen><Muted>PLAYER PROFILE</Muted><Heading>Section not found</Heading></Screen>;
  return <Component/>;
}
