import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {ActivityIndicator,AppState,ImageBackground,Linking,Pressable,ScrollView,Share,StyleSheet,Text,TextInput,View} from "react-native";
import {useLocalSearchParams,router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {Screen} from "@/components/Screen";
import {Button,Card,Eyebrow,Heading,Muted,Subheading} from "@/components/UI";
import {supabase} from "@/lib/supabase";
import {theme} from "@/lib/theme";
import {BRAND} from "@/lib/brand";
type Tour={id:string;uid:string;slug:string;title:string;title_bn:string;description?:string;description_bn?:string;mode:string;entry_fee:number;prize_pool:number;slots:number;slots_filled:number;status:string;start_at:string;map:string;cover?:string};
type Participant={id:string;display_name:string;team_name?:string;game_uid?:string;slot_number?:number;status:string};
type Result={id:string;participant_name:string;team_name?:string;rank:number;kills:number;points:number;prize_amount?:number};
type Match={id:string;match_number:number;map:string;start_at?:string;status:string;notes?:string};
type RoomCredentials={room_id:string|null;room_password:string|null};
type Content={rules?:string[];banned_items?:string[];penalties?:{offense:Record<string,string>;action:Record<string,string>}[];placement_points?:{place:number;points:number}[];prizes?:{place:string;amount:number}[];schedule?:{match:number;map:string;time:string;status:string}[];organizer_note?:string;matches_description?:string};
const tabs=["overview","rules","schedule","prizes","teams","results"] as const;type Tab=typeof tabs[number];
const rules=["All players must use their own Free Fire account. Account sharing is not allowed.","Join the custom room within the given time. Late join may lead to forfeit of that match.","Team names and in-game names must not contain offensive, political, or banned words.","Players must stay in the lobby until the match starts. Leaving early can result in a penalty.","Only registered players/slots may play. Substitutes need organizer approval.","Internet or device issues are the player's responsibility.","Screenshots or recordings may be requested for result verification.","Organizer decisions on disputes are final after evidence review.","Respect opponents and staff. Toxic behaviour may lead to a warning or ban.","Prize is paid only to the registered bKash / Nagad number after result confirmation."];
const banned=["Any hack, mod menu, aimbot, wallhack, or third-party cheat","Emulator unless the cup is marked Emulator-allowed","Teaming with another squad/solo in BR matches","Account boosting / rank boosting services","Ghosting or stream sniping","Intentionally disconnecting to avoid loss"];
const placement=[{place:1,points:12},{place:2,points:9},{place:3,points:8},{place:4,points:7},{place:5,points:6},{place:6,points:5},{place:7,points:4},{place:8,points:3},{place:9,points:2},{place:10,points:1},{place:11,points:0},{place:12,points:0}];
const money=(n:number)=>"৳"+Number(n||0).toLocaleString("en-BD");const date=(v?:string)=>v?new Date(v).toLocaleString("en-GB",{timeZone:"Asia/Dhaka",dateStyle:"medium",timeStyle:"short"}):"To be announced";
export default function TournamentDetail(){
 const {slug}=useLocalSearchParams<{slug:string}>();const [tour,setTour]=useState<Tour|null>(null);const [content,setContent]=useState<Content|null>(null);const [participants,setParticipants]=useState<Participant[]>([]);const [results,setResults]=useState<Result[]>([]);const [matches,setMatches]=useState<Match[]>([]);const [tab,setTab]=useState<Tab>("overview");const [loading,setLoading]=useState(true);const [error,setError]=useState("");const [showRegister,setShowRegister]=useState(false);const [registering,setRegistering]=useState(false);const [registered,setRegistered]=useState(false);const [displayName,setDisplayName]=useState("");const [teamName,setTeamName]=useState("");const [gameUid,setGameUid]=useState("");const [paymentSource,setPaymentSource]=useState<"wallet"|"direct">("wallet");const [paymentMethod,setPaymentMethod]=useState("bKash");const [senderNumber,setSenderNumber]=useState("");const [transactionReference,setTransactionReference]=useState("");const [registrationStatus,setRegistrationStatus]=useState("confirmed");const [paymentAccounts,setPaymentAccounts]=useState<Record<string,string>>({bKash:"",Nagad:"",Rocket:""});const [roomCredentials,setRoomCredentials]=useState<RoomCredentials|null>(null);
 const requestRef=useRef(0);const load=useCallback(async()=>{const request=++requestRef.current;setRoomCredentials(null);setRegistered(false);if(!supabase){setError("Supabase configuration is missing.");setLoading(false);return}const {data,error}=await supabase.from("tournaments").select("*").eq("slug",slug).maybeSingle();if(request!==requestRef.current)return;if(error||!data){setError(error?.message||"Tournament not found.");setLoading(false);return}setTour(data as Tour);const [c,p,r,m,pay]=await Promise.all([supabase.from("tournament_content").select("*").eq("tournament_id",data.id).maybeSingle(),supabase.rpc("get_public_tournament_roster",{p_tournament_id:data.id}),supabase.rpc("get_public_tournament_results",{p_tournament_id:data.id}),supabase.from("tournament_matches").select("id,match_number,map,start_at,status,notes").eq("tournament_id",data.id).order("match_number",{ascending:true}),supabase.from("website_settings").select("key,value").in("key",["payment_bkash_number","payment_nagad_number","payment_rocket_number"])]);if(request!==requestRef.current)return;if(c.data)setContent(c.data as Content);setParticipants((p.data??[]) as Participant[]);setPaymentAccounts(Object.fromEntries((pay.data??[]).map(row=>[row.key==="payment_bkash_number"?"bKash":row.key==="payment_nagad_number"?"Nagad":"Rocket",row.value])));const {data:authData}=await supabase.auth.getUser();if(request!==requestRef.current)return;if(authData.user){const {data:mine}=await supabase.from("tournament_participants").select("id,display_name,team_name,game_uid,status").eq("tournament_id",data.id).eq("user_id",authData.user.id).in("status",["registered","confirmed"]).maybeSingle();setRegistered(Boolean(mine));if(mine){setRegistrationStatus(mine.status==="confirmed"?"confirmed":"pending");setDisplayName(mine.display_name);setTeamName(mine.team_name??"");setGameUid(mine.game_uid??"");if(mine.status==="confirmed"){const {data:roomData}=await supabase.rpc("get_my_tournament_room_credentials",{p_tournament_id:data.id});if(request===requestRef.current)setRoomCredentials((roomData?.[0] as RoomCredentials|undefined)??null)}}}setResults((r.data??[]) as Result[]);setMatches((m.data??[]) as Match[]);setLoading(false)},[slug]);useEffect(()=>{void load()},[load]);
 const roomTournamentId=tour?.id;
 const roomTournamentStartAt=tour?.start_at;
 useEffect(()=>{
  const client=supabase;
  if(!client||!roomTournamentId||!roomTournamentStartAt||!registered||registrationStatus!=="confirmed"||roomCredentials)return;
  let active=true;
  let poll:ReturnType<typeof setInterval>|undefined;
  let unlockTimer:ReturnType<typeof setTimeout>|undefined;
  const startAt=new Date(roomTournamentStartAt).getTime();
  const unlockAt=startAt-10*60*1000;
  const expiresAt=startAt+6*60*60*1000;
  if(!Number.isFinite(startAt))return;
  const refresh=async()=>{
    if(!active||Date.now()>expiresAt)return;
    const {data,error}=await client.rpc("get_my_tournament_room_credentials",{p_tournament_id:roomTournamentId});
    if(!active||error)return;
    const credentials=(data?.[0] as RoomCredentials|undefined)??null;
    if(credentials){
      setRoomCredentials(credentials);
      if(poll)clearInterval(poll);
    }
  };
  const beginPolling=()=>{
    void refresh();
    if(!poll&&Date.now()<=expiresAt){
      poll=setInterval(()=>{
        if(Date.now()>expiresAt){
          if(poll)clearInterval(poll);
          return;
        }
        void refresh();
      },60000);
    }
  };
  if(Date.now()>=unlockAt)beginPolling();
  else unlockTimer=setTimeout(beginPolling,Math.max(0,unlockAt-Date.now()));
  const subscription=AppState.addEventListener("change",state=>{
    if(state==="active")void refresh();
  });
  return ()=>{
    active=false;
    if(unlockTimer)clearTimeout(unlockTimer);
    if(poll)clearInterval(poll);
    subscription.remove();
  };
 },[roomTournamentId,roomTournamentStartAt,registered,registrationStatus,roomCredentials]);
 const prizes=useMemo(()=>content?.prizes?.length?content.prizes:[{place:"1st",amount:Math.round((tour?.prize_pool||0)*.4)},{place:"2nd",amount:Math.round((tour?.prize_pool||0)*.25)},{place:"3rd",amount:Math.round((tour?.prize_pool||0)*.15)},{place:"4th",amount:Math.round((tour?.prize_pool||0)*.1)},{place:"MVP / Most kills",amount:Math.round((tour?.prize_pool||0)*.1)}],[content,tour]);
 if(loading)return <Screen onRefresh={load}><ActivityIndicator color={theme.accent}/><Muted>Loading tournament details…</Muted></Screen>;
 if(error||!tour)return <Screen><Heading>Tournament unavailable</Heading><Muted>{error}</Muted><Button onPress={()=>router.back()}>GO BACK</Button></Screen>;
 const slotsLeft=Math.max(0,tour.slots-tour.slots_filled);const full=slotsLeft===0;const closed=tour.status!=="upcoming"||full;const schedule=matches.length?matches.map(m=>({match:m.match_number,map:m.map,time:m.start_at||"",status:m.status})):content?.schedule?.length?content.schedule:[1,2,3].map((n,i)=>({match:n,map:[tour.map,"Bermuda","Purgatory"][i],time:new Date(new Date(tour.start_at).getTime()+i*35*60000).toISOString(),status:i===0?"upcoming":"scheduled"}));
 const labels:Record<Tab,string>={overview:"Overview",rules:"Rules",schedule:"Schedule",prizes:"Prizes",teams:"Teams",results:"Results"};
 const share=()=>Share.share({message:tour.title+" — "+BRAND.name+" https://ff-bd-tournaments.vercel.app/tournaments/"+tour.slug});
 const openRegistration=async()=>{if(!supabase)return;const {data}=await supabase.auth.getUser();if(!data.user){router.push("/login");return}const {data:latest,error:latestError}=await supabase.from("tournaments").select("slots,slots_filled,status").eq("id",tour.id).maybeSingle();if(latestError||!latest){setError(latestError?.message||"Could not verify tournament availability.");return}if(latest.status!=="upcoming"||latest.slots_filled>=latest.slots){setTour({...tour,slots:latest.slots,slots_filled:latest.slots_filled,status:latest.status});setError(latest.slots_filled>=latest.slots?"This tournament is full. No more registrations are available.":"Registration is closed for this tournament.");return}const {data:profile}=await supabase.from("player_profiles").select("username,game_uid").eq("user_id",data.user.id).maybeSingle();setDisplayName(profile?.username??data.user.email?.split("@")[0]??"");setGameUid(profile?.game_uid??"");setShowRegister(true)};
 const submitRegistration=async()=>{
  if(!supabase||!tour)return;
  setError("");

  if(displayName.trim().length<2){
    setError("Enter your in-game player name.");
    return;
  }

  setRegistering(true);
  let registrationError:string|null=null;

  if(tour.entry_fee>0&&paymentSource==="direct"){
    if(!paymentAccounts[paymentMethod]?.trim()){
      setRegistering(false);
      setError("The official receiving number for this payment method has not been configured. Please contact the admin.");
      return;
    }

    if(senderNumber.trim().length<8||transactionReference.trim().length<4){
      setRegistering(false);
      setError("Enter sender mobile number and transaction reference.");
      return;
    }

    const result=await supabase.rpc("submit_direct_tournament_payment",{
      p_tournament_id:tour.id,
      p_display_name:displayName.trim(),
      p_team_name:teamName.trim()||null,
      p_game_uid:gameUid.trim()||null,
      p_payment_method:paymentMethod,
      p_sender_number:senderNumber.trim(),
      p_transaction_reference:transactionReference.trim()
    });

    registrationError=result.error?.message??null;
  }else{
    const result=await supabase.rpc("register_for_tournament",{
      p_tournament_id:tour.id,
      p_display_name:displayName.trim(),
      p_team_name:teamName.trim()||null,
      p_game_uid:gameUid.trim()||null
    });

    registrationError=result.error?.message??null;
  }

  setRegistering(false);

  if(registrationError){
    setError(registrationError);
    return;
  }

  const finalStatus=paymentSource==="direct"&&tour.entry_fee>0?"registered":"confirmed";

  // The registration RPC succeeded. Keep the success state even if a
  // subsequent read fails; never fabricate a slot number or participant row.
  setRegistrationStatus(finalStatus);
  setRegistered(true);
  setShowRegister(false);
  setRoomCredentials(null);

  const {data:authData}=await supabase.auth.getUser();

  const [latestTourResult,latestRosterResult]=await Promise.all([
    supabase.from("tournaments")
      .select("*")
      .eq("id",tour.id)
      .maybeSingle(),
    supabase.rpc("get_public_tournament_roster",{p_tournament_id:tour.id})
  ]);

  if(latestTourResult.error||!latestTourResult.data||latestRosterResult.error){
    setError("Registration succeeded, but the latest tournament details could not be refreshed. Reopen this tournament to load the current slots and registration status.");
    return;
  }

  const latestTour=latestTourResult.data as Tour;
  const latestParticipants=(latestRosterResult.data??[]) as Participant[];

  setTour(latestTour);
  setParticipants(latestParticipants);

  const {data:mine}=authData.user?await supabase.from("tournament_participants").select("id,display_name,team_name,game_uid,status").eq("tournament_id",tour.id).eq("user_id",authData.user.id).in("status",["registered","confirmed"]).maybeSingle():{data:null};

  if(mine){
    setRegistered(true);
    setRegistrationStatus(mine.status==="confirmed"?"confirmed":"pending");
    setDisplayName(mine.display_name);
    setTeamName(mine.team_name??"");
    setGameUid(mine.game_uid??"");
  }

  if((mine?.status??finalStatus)==="confirmed"){
    const {data:roomData,error:roomError}=await supabase.rpc(
      "get_my_tournament_room_credentials",
      {p_tournament_id:tour.id}
    );

    if(!roomError){setRoomCredentials((roomData?.[0] as RoomCredentials|undefined)??null);}
  }
};

 return <Screen><View style={s.top}><Pressable onPress={()=>router.back()} style={s.back}><Ionicons name="arrow-back" size={21} color="#fff"/></Pressable><Text style={s.topTitle}>TOURNAMENT DETAILS</Text><Pressable onPress={share} style={s.back}><Ionicons name="share-social-outline" size={20} color="#fff"/></Pressable></View>
 <ImageBackground source={{uri:tour.cover||BRAND.cover}} imageStyle={s.image} style={s.hero}><View style={s.shade}/><View style={s.heroContent}><View style={s.badges}><Text style={s.badge}>{tour.status.toUpperCase()}</Text><Text style={s.badge}>{tour.mode.toUpperCase()}</Text><Text style={s.badge}>{tour.map}</Text><Text style={s.badge}>{tour.entry_fee===0?"FREE":"PAID"}</Text></View><Eyebrow>{tour.uid}</Eyebrow><Text style={s.heroTitle}>{tour.title}</Text><Text style={s.heroTitleBn}>{tour.title_bn}</Text><View style={s.metrics}><View><Muted>PRIZE POOL</Muted><Text style={s.prize}>{money(tour.prize_pool)}</Text></View><View><Muted>ENTRY FEE</Muted><Text style={s.metricValue}>{tour.entry_fee===0?"FREE":money(tour.entry_fee)}</Text></View><View><Muted>STARTS (BD)</Muted><Text style={s.metricValue}>{date(tour.start_at)}</Text></View></View><Muted>{tour.slots_filled}/{tour.slots} slots filled · {slotsLeft} remaining</Muted><View style={s.progress}><View style={{height:7,width:(Math.min(100,tour.slots?tour.slots_filled/tour.slots*100:0)+"%") as `${number}%`,backgroundColor:theme.accent,borderRadius:8}}/></View><Button disabled={closed||registered} onPress={openRegistration}>{full?"TOURNAMENT FULL":closed?"REGISTRATION CLOSED":registered?(registrationStatus==="confirmed"?"YOU ARE REGISTERED":"PAYMENT UNDER REVIEW"):"REGISTER NOW"}</Button></View></ImageBackground>
 {showRegister&&<Card><Subheading>Complete your registration</Subheading><Muted>{tour.entry_fee===0?"Free entry": "Entry fee: "+money(tour.entry_fee)+" · Choose wallet or direct mobile payment."}</Muted>{tour.entry_fee>0&&<View style={s.paymentOptions}><Pressable onPress={()=>setPaymentSource("wallet")} style={[s.paymentOption,paymentSource==="wallet"&&s.paymentOptionActive]}><Text style={s.paymentOptionText}>Pay from Wallet</Text></Pressable><Pressable onPress={()=>setPaymentSource("direct")} style={[s.paymentOption,paymentSource==="direct"&&s.paymentOptionActive]}><Text style={s.paymentOptionText}>Direct bKash / Nagad / Rocket</Text></Pressable></View>}{tour.entry_fee>0&&paymentSource==="direct"&&<><View style={s.paymentOptions}>{["bKash","Nagad","Rocket"].map(method=><Pressable key={method} onPress={()=>setPaymentMethod(method)} style={[s.paymentOption,paymentMethod===method&&s.paymentOptionActive]}><Text style={s.paymentOptionText}>{method}</Text></Pressable>)}</View><Card><Subheading>Send entry fee to {paymentMethod}</Subheading><Text style={s.paymentAccountNumber}>{paymentAccounts[paymentMethod]||"Not configured by admin yet"}</Text><Muted>{paymentAccounts[paymentMethod]?"Send the exact entry fee to this official number, then enter the sender number and transaction ID below.":"Do not send money yet. The admin must configure this payment number in Website Settings."}</Muted></Card><TextInput value={senderNumber} onChangeText={setSenderNumber} keyboardType="phone-pad" placeholder="Sender mobile number" placeholderTextColor={theme.muted} style={s.registerInput}/><TextInput value={transactionReference} onChangeText={setTransactionReference} autoCapitalize="characters" placeholder="Payment transaction ID" placeholderTextColor={theme.muted} style={s.registerInput}/><Muted>Direct payments remain pending until an admin verifies the transaction.</Muted></>}<TextInput value={displayName} onChangeText={setDisplayName} placeholder="In-game player name" placeholderTextColor={theme.muted} style={s.registerInput}/>{tour.mode!=="Solo"?<TextInput value={teamName} onChangeText={setTeamName} placeholder="Team name" placeholderTextColor={theme.muted} style={s.registerInput}/>:null}<TextInput value={gameUid} onChangeText={setGameUid} placeholder="Free Fire UID" placeholderTextColor={theme.muted} style={s.registerInput}/><Button loading={registering} disabled={tour.entry_fee>0&&paymentSource==="direct"&&!paymentAccounts[paymentMethod]?.trim()} onPress={submitRegistration}>CONFIRM & JOIN TOURNAMENT</Button><Pressable onPress={()=>setShowRegister(false)}><Text style={s.link}>CANCEL</Text></Pressable></Card>}\n <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll}>{tabs.map(key=><Pressable key={key} onPress={()=>setTab(key)} style={[s.tab,tab===key&&s.tabActive]}><Text style={[s.tabText,tab===key&&s.tabTextActive]}>{labels[key]}</Text></Pressable>)}</ScrollView>
 {tab==="overview"&&<View style={s.content}><Heading>Overview</Heading><Card><Text style={s.rowText}>Format: {tour.mode} Battle Royale · {tour.map}</Text><Text style={s.rowText}>Team size: {tour.mode==="Solo"?1:tour.mode==="Duo"?2:4}</Text><Text style={s.rowText}>Start time: {date(tour.start_at)} (GMT+6)</Text><Text style={s.rowText}>Slots: {tour.slots_filled}/{tour.slots}</Text><Text style={s.rowText}>Matches: {matches.length||3} matches · Total points decide rank</Text><Muted>{tour.description||"Join the tournament and compete fairly with other Free Fire players."}</Muted><Muted>{content?.organizer_note||"Room ID unlocks 10 minutes before start. Paid cups need payment confirmation. Play fair."}</Muted></Card><Card><Subheading><Ionicons name="lock-closed" color={theme.accent}/> Room details</Subheading>{registrationStatus==="confirmed"&&registered&&roomCredentials?(<><Muted>Admin has released the room details for confirmed players.</Muted><Text style={s.locked}>ROOM ID:  {roomCredentials.room_id||"Not set"}</Text><Text style={s.locked}>PASSWORD:  {roomCredentials.room_password||"Not set"}</Text></>):registered&&registrationStatus!=="confirmed"?<Muted>Room ID and password will be available after your registration is confirmed and Admin releases them.</Muted>:<Muted>Room ID and password unlock 10 minutes before match start, once Admin releases them.</Muted>}</Card></View>}
 {tab==="rules"&&<View style={s.content}><Heading>Rules</Heading><Card>{(content?.rules?.length?content.rules:rules).map((v,i)=><Text key={i} style={s.rowText}>{i+1}. {v}</Text>)}</Card><Heading>Banned</Heading><Card>{(content?.banned_items?.length?content.banned_items:banned).map((v,i)=><Text key={i} style={s.banned}>✕  {v}</Text>)}</Card><Heading>Penalties</Heading><Card>{(content?.penalties||[]).map((v,i)=><Text key={i} style={s.rowText}>{v.offense.en||v.offense.bn} — {v.action.en||v.action.bn}</Text>)}</Card><Heading>Points system</Heading><Card>{(content?.placement_points?.length?content.placement_points:placement).map(v=><Text key={v.place} style={s.rowText}>#{v.place}  ·  {v.points} points</Text>)}<Text style={s.prize}>+1 point per kill</Text></Card></View>}
 {tab==="schedule"&&<View style={s.content}><Heading>Match Schedule</Heading>{schedule.length?schedule.map(m=><Card key={m.match}><Subheading>Match {m.match} · {m.map}</Subheading><Muted>{date(m.time)} · {m.status}</Muted></Card>):<Card><Muted>Match schedule has not been published yet.</Muted></Card>}</View>}
 {tab==="prizes"&&<View style={s.content}><Heading>Prize Distribution</Heading><Muted>Total pool: {money(tour.prize_pool)} · Paid via bKash / Nagad after verification.</Muted>{prizes.map((p,i)=><Card key={i}><View style={s.between}><Subheading>{p.place}</Subheading><Text style={s.prize}>{money(p.amount)}</Text></View></Card>)}</View>}
 {tab==="teams"&&<View style={s.content}><Heading>Registered Teams</Heading><Muted>{participants.length} registered players / teams</Muted>{participants.length?participants.map((p,i)=><Card key={p.id}><View style={s.between}><Subheading>{p.slot_number||i+1}. {p.team_name||p.display_name}</Subheading><Text style={s.status}>{p.status}</Text></View><Muted>{p.display_name}{p.game_uid?" · UID "+p.game_uid:""}</Muted></Card>):<Card><Muted>No teams registered yet.</Muted></Card>}</View>}
 {tab==="results"&&<View style={s.content}><Heading>Results</Heading>{results.length?results.map(r=><Card key={r.id}><View style={s.between}><Subheading>#{r.rank} {r.team_name||r.participant_name}</Subheading><Text style={s.prize}>{r.points} pts</Text></View><Muted>{r.kills} kills · Prize {money(r.prize_amount||0)}</Muted></Card>):<Card><Muted>{tour.status!=="ended"?"Results will appear here after the tournament is completed.":"No results have been published yet."}</Muted></Card>}</View>}
 <View style={s.related}><Button onPress={()=>router.push("/(tabs)/tournaments")}>BROWSE MORE TOURNAMENTS</Button><Pressable onPress={()=>Linking.openURL(BRAND.social.telegram)}><Text style={s.link}>CONTACT SUPPORT ON TELEGRAM</Text></Pressable></View>
 </Screen>
}
const s=StyleSheet.create({paymentAccountNumber:{color:"#fff",fontSize:18,fontWeight:"900"},paymentOptions:{flexDirection:"row",flexWrap:"wrap",gap:7},paymentOption:{paddingHorizontal:11,paddingVertical:9,borderRadius:10,borderWidth:1,borderColor:theme.border,backgroundColor:"#0B1221"},paymentOptionActive:{borderColor:theme.accent,backgroundColor:"rgba(255,92,0,.12)"},paymentOptionText:{color:"#fff",fontSize:11,fontWeight:"800"},registerInput:{minHeight:46,borderWidth:1,borderColor:theme.border,borderRadius:11,paddingHorizontal:13,color:"#fff",backgroundColor:"#0B1221"},top:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},back:{width:40,height:40,borderRadius:12,backgroundColor:theme.surface,borderWidth:1,borderColor:theme.border,alignItems:"center",justifyContent:"center"},topTitle:{color:theme.muted,fontSize:10,fontWeight:"900",letterSpacing:1.4},hero:{minHeight:430,borderRadius:19,overflow:"hidden",backgroundColor:theme.backgroundAlt},image:{borderRadius:19},shade:{...StyleSheet.absoluteFillObject,backgroundColor:"rgba(5,11,22,.78)"},heroContent:{padding:17,gap:12},badges:{flexDirection:"row",flexWrap:"wrap",gap:6},badge:{color:"#fff",fontSize:9,fontWeight:"900",backgroundColor:"rgba(255,255,255,.15)",paddingHorizontal:9,paddingVertical:6,borderRadius:14,overflow:"hidden"},heroTitle:{color:"#fff",fontSize:27,fontWeight:"900"},heroTitleBn:{color:"#fff",fontSize:15,fontWeight:"700"},metrics:{flexDirection:"row",justifyContent:"space-between",gap:8},prize:{color:theme.gold,fontSize:17,fontWeight:"900"},metricValue:{color:"#fff",fontSize:12,fontWeight:"900",marginTop:4},progress:{height:7,borderRadius:8,backgroundColor:"rgba(255,255,255,.15)",overflow:"hidden"},tabScroll:{maxHeight:48,marginHorizontal:-2},tab:{paddingHorizontal:14,paddingVertical:12,borderRadius:10,marginRight:5},tabActive:{backgroundColor:theme.accent},tabText:{color:theme.muted,fontSize:12,fontWeight:"800"},tabTextActive:{color:"#fff"},content:{gap:12},rowText:{color:"#E2E8F0",fontSize:13,lineHeight:21},locked:{color:theme.muted,fontFamily:"monospace",padding:10,backgroundColor:"#0B1221",borderRadius:8},banned:{color:"#FCA5A5",fontSize:13,lineHeight:20},between:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:8},status:{color:theme.green,fontSize:10,fontWeight:"900"},related:{gap:12,paddingVertical:10},link:{color:theme.accent,textAlign:"center",fontSize:11,fontWeight:"900"}});
