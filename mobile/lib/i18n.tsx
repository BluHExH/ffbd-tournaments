import {createContext,useContext,useEffect,useMemo,useState,type PropsWithChildren} from "react";
import {Pressable,StyleSheet,Text,View} from "react-native";
import * as SecureStore from "expo-secure-store";

export type Language="en"|"bn";
type Translator=(key:string)=>string;
const messages:Record<Language,Record<string,string>>={
 en:{
  "nav.home":"Home","nav.tournaments":"Tournament","nav.results":"Results","nav.wallet":"Wallet","nav.profile":"Profile",
  "language":"Language","language.english":"English","language.bangla":"বাংলা",
  "auth.login":"Login","auth.register":"Registration","auth.email":"Email address","auth.password":"Password",
  "auth.confirmPassword":"Confirm password","auth.forgot":"Forgot password?","auth.signIn":"Sign in","auth.create":"Create account",
  "auth.welcome":"Welcome back","auth.loginDescription":"Sign in to continue to your tournaments and player account.",
  "auth.registerTitle":"Create your account","auth.registerDescription":"Register once to join tournaments and manage your player profile.",
  "auth.newPlayer":"New player?","auth.already":"Already have an account?","auth.show":"SHOW","auth.hide":"HIDE",
  "auth.emailPlaceholder":"you@example.com","auth.passwordPlaceholder":"Enter your password","auth.passwordHint":"At least 8 characters",
  "profile.title":"Profile","profile.playerAccount":"PLAYER ACCOUNT","profile.walletPayments":"WALLET & PAYMENTS",
  "profile.player":"PLAYER ACCOUNT","profile.community":"COMMUNITY & SUPPORT","profile.myProfile":"My Profile",
  "profile.myMatch":"My Match","profile.results":"Results","profile.topPlayers":"Top Players","profile.rules":"All Rules",
  "profile.developer":"Developer Profile","profile.notifications":"Notifications","profile.addMoney":"Add Money",
  "profile.withdraw":"Withdraw","profile.transactions":"Transaction History","profile.walletDesc":"View your balance and wallet activity",
  "profile.addDesc":"Add funds to your wallet","profile.withdrawDesc":"Request a withdrawal","profile.transactionsDesc":"View deposits and payments",
  "profile.profileDesc":"Personal details and account settings","profile.matchDesc":"Your joined and upcoming matches",
  "profile.resultsDesc":"Tournament results and performance","profile.topDesc":"Leaderboard and player rankings",
  "profile.rulesDesc":"Tournament and platform rules","profile.developerDesc":"About the app developer","profile.noticeDesc":"Your account updates",
  "profile.signedIn":"Player Account","profile.welcome":"Welcome, Player","profile.signInHint":"Sign in to access your player account and tournament services.",
  "profile.login":"Login","profile.create":"Create account","profile.signOut":"Sign out","profile.admin":"Open admin dashboard",
  "match.center":"PLAYER MATCH CENTER","match.title":"My Matches","match.signIn":"Please sign in to view your matches.",
  "match.empty":"You have not joined any tournaments yet.","match.viewRoom":"VIEW ROOM DETAILS",
  "results.performance":"YOUR PERFORMANCE","results.title":"Results","results.empty":"No verified results are linked to your account yet.",
  "top.community":"COMMUNITY RANKINGS","top.title":"Top 20 Players",
  "wallet.finance":"PLAYER FINANCE","wallet.title":"My Wallet","wallet.balance":"AVAILABLE BALANCE","wallet.server":"Balance is managed by the secure server-side wallet ledger.","wallet.refresh":"REFRESH BALANCE","wallet.signIn":"Sign in required","wallet.signInHint":"Log in with your website account to view your balance, deposits and withdrawals.","wallet.add":"Add Money","wallet.addHint":"Send money to the official account, then submit the sender number and transaction reference. Funds are added only after admin verification.","wallet.withdraw":"Withdraw Money","wallet.withdrawHint":"Minimum ৳100. Requested funds are reserved immediately. If admin rejects the request, the amount is returned to your wallet.","wallet.depositRequests":"Deposit Requests","wallet.withdrawRequests":"Withdrawal Requests","wallet.history":"Transaction History","wallet.noDeposits":"No deposit requests yet.","wallet.noWithdrawals":"No withdrawal requests yet.","wallet.noTransactions":"No transactions yet.","wallet.sendTo":"SEND TO OFFICIAL","wallet.notConfigured":"Not configured by admin yet","wallet.amount":"Amount in ৳","wallet.sender":"Sender mobile number","wallet.reference":"Transaction ID / reference","wallet.submitDeposit":"SUBMIT DEPOSIT REQUEST","wallet.amountMinimum":"Amount (minimum ৳100)","wallet.recipient":"Your bKash / Nagad / Rocket number","wallet.requestWithdraw":"REQUEST WITHDRAWAL",
  "home.title":"BANGLAR TOURNAMENTS","home.featured":"Featured Tournaments","home.live":"Live & Upcoming","home.topTeams":"Top Teams","home.recentPayouts":"Recent Payouts","home.how":"How it works","tournaments.title":"Find your match."
 },
 bn:{
  "nav.home":"হোম","nav.tournaments":"টুর্নামেন্ট","nav.results":"রেজাল্ট","nav.wallet":"ওয়ালেট","nav.profile":"প্রোফাইল",
  "language":"ভাষা","language.english":"English","language.bangla":"বাংলা",
  "auth.login":"লগইন","auth.register":"রেজিস্ট্রেশন","auth.email":"ইমেইল ঠিকানা","auth.password":"পাসওয়ার্ড",
  "auth.confirmPassword":"পাসওয়ার্ড নিশ্চিত করুন","auth.forgot":"পাসওয়ার্ড ভুলে গেছেন?","auth.signIn":"লগইন করুন","auth.create":"অ্যাকাউন্ট তৈরি করুন",
  "auth.welcome":"স্বাগতম","auth.loginDescription":"আপনার টুর্নামেন্ট ও প্লেয়ার অ্যাকাউন্টে প্রবেশ করতে লগইন করুন।",
  "auth.registerTitle":"নতুন অ্যাকাউন্ট তৈরি করুন","auth.registerDescription":"একটি অ্যাকাউন্ট দিয়ে টুর্নামেন্টে যোগ দিন এবং প্রোফাইল পরিচালনা করুন।",
  "auth.newPlayer":"নতুন প্লেয়ার?","auth.already":"আগে থেকেই অ্যাকাউন্ট আছে?","auth.show":"দেখুন","auth.hide":"লুকান",
  "auth.emailPlaceholder":"you@example.com","auth.passwordPlaceholder":"পাসওয়ার্ড লিখুন","auth.passwordHint":"কমপক্ষে ৮ অক্ষর",
  "profile.title":"প্রোফাইল","profile.playerAccount":"প্লেয়ার অ্যাকাউন্ট","profile.walletPayments":"ওয়ালেট ও পেমেন্ট",
  "profile.player":"প্লেয়ার অ্যাকাউন্ট","profile.community":"কমিউনিটি ও সহায়তা","profile.myProfile":"আমার প্রোফাইল",
  "profile.myMatch":"আমার ম্যাচ","profile.results":"রেজাল্ট","profile.topPlayers":"সেরা প্লেয়ার","profile.rules":"সকল নিয়ম",
  "profile.developer":"ডেভেলপার প্রোফাইল","profile.notifications":"নোটিফিকেশন","profile.addMoney":"টাকা যোগ করুন",
  "profile.withdraw":"টাকা উত্তোলন","profile.transactions":"লেনদেনের ইতিহাস","profile.walletDesc":"ব্যালেন্স ও ওয়ালেট দেখুন",
  "profile.addDesc":"ওয়ালেটে টাকা যোগ করুন","profile.withdrawDesc":"টাকা উত্তোলনের অনুরোধ করুন","profile.transactionsDesc":"জমা ও পেমেন্টের তথ্য দেখুন",
  "profile.profileDesc":"ব্যক্তিগত তথ্য ও অ্যাকাউন্ট সেটিংস","profile.matchDesc":"আপনার যোগ দেওয়া ও আসন্ন ম্যাচ",
  "profile.resultsDesc":"টুর্নামেন্টের ফলাফল ও পারফরম্যান্স","profile.topDesc":"লিডারবোর্ড ও প্লেয়ার র‍্যাঙ্কিং",
  "profile.rulesDesc":"টুর্নামেন্ট ও প্ল্যাটফর্মের নিয়ম","profile.developerDesc":"অ্যাপ ডেভেলপার সম্পর্কে","profile.noticeDesc":"আপনার অ্যাকাউন্টের আপডেট",
  "profile.signedIn":"প্লেয়ার অ্যাকাউন্ট","profile.welcome":"স্বাগতম, প্লেয়ার","profile.signInHint":"প্লেয়ার অ্যাকাউন্ট ও টুর্নামেন্ট ব্যবহার করতে লগইন করুন।",
  "profile.login":"লগইন","profile.create":"অ্যাকাউন্ট খুলুন","profile.signOut":"লগআউট","profile.admin":"অ্যাডমিন ড্যাশবোর্ড",
  "match.center":"প্লেয়ার ম্যাচ সেন্টার","match.title":"আমার ম্যাচ","match.signIn":"ম্যাচ দেখতে লগইন করুন।",
  "match.empty":"আপনি এখনো কোনো টুর্নামেন্টে যোগ দেননি।","match.viewRoom":"রুমের তথ্য দেখুন",
  "results.performance":"আপনার পারফরম্যান্স","results.title":"রেজাল্ট","results.empty":"আপনার অ্যাকাউন্টে এখনো কোনো যাচাইকৃত ফলাফল নেই।",
  "top.community":"কমিউনিটি র‍্যাঙ্কিং","top.title":"সেরা ২০ প্লেয়ার",
  "wallet.finance":"প্লেয়ার ফাইন্যান্স","wallet.title":"আমার ওয়ালেট","wallet.balance":"বর্তমান ব্যালেন্স","wallet.server":"সার্ভার নিরাপদভাবে আপনার ব্যালেন্স পরিচালনা করে।","wallet.refresh":"ব্যালেন্স রিফ্রেশ","wallet.signIn":"লগইন প্রয়োজন","wallet.signInHint":"ব্যালেন্স, জমা ও উত্তোলন দেখতে আপনার ওয়েবসাইট অ্যাকাউন্টে লগইন করুন।","wallet.add":"টাকা যোগ করুন","wallet.addHint":"অফিশিয়াল নম্বরে টাকা পাঠিয়ে প্রেরকের নম্বর ও ট্রানজ্যাকশন আইডি দিন। অ্যাডমিন যাচাইয়ের পর টাকা যোগ হবে।","wallet.withdraw":"টাকা উত্তোলন","wallet.withdrawHint":"সর্বনিম্ন ১০০ টাকা। অনুরোধের টাকা সাময়িকভাবে সংরক্ষিত থাকবে। অ্যাডমিন বাতিল করলে টাকা ওয়ালেটে ফেরত আসবে।","wallet.depositRequests":"টাকা জমার অনুরোধ","wallet.withdrawRequests":"টাকা উত্তোলনের অনুরোধ","wallet.history":"লেনদেনের ইতিহাস","wallet.noDeposits":"এখনো কোনো জমার অনুরোধ নেই।","wallet.noWithdrawals":"এখনো কোনো উত্তোলনের অনুরোধ নেই।","wallet.noTransactions":"এখনো কোনো লেনদেন নেই।","wallet.sendTo":"অফিশিয়াল নম্বরে পাঠান","wallet.notConfigured":"অ্যাডমিন এখনো নম্বর সেট করেননি","wallet.amount":"টাকার পরিমাণ","wallet.sender":"প্রেরকের মোবাইল নম্বর","wallet.reference":"ট্রানজ্যাকশন আইডি / রেফারেন্স","wallet.submitDeposit":"জমার অনুরোধ পাঠান","wallet.amountMinimum":"পরিমাণ (সর্বনিম্ন ১০০ টাকা)","wallet.recipient":"আপনার বিকাশ / নগদ / রকেট নম্বর","wallet.requestWithdraw":"উত্তোলনের অনুরোধ করুন",
  "home.title":"বাংলার টুর্নামেন্টস","home.featured":"বিশেষ টুর্নামেন্ট","home.live":"লাইভ ও আসন্ন","home.topTeams":"সেরা দল","home.recentPayouts":"সাম্প্রতিক পেমেন্ট","home.how":"যেভাবে কাজ করে","tournaments.title":"আপনার ম্যাচ খুঁজুন।", }
};
type LanguageContextValue={language:Language;setLanguage:(language:Language)=>void;t:Translator};
const LanguageContext=createContext<LanguageContextValue|null>(null);
export function LanguageProvider({children}:PropsWithChildren){
 const [language,setLanguageState]=useState<Language>("en");
 useEffect(()=>{let active=true;void SecureStore.getItemAsync("banglar-language").then(value=>{if(active&&(value==="bn"||value==="en"))setLanguageState(value)}).catch(()=>{});return()=>{active=false}},[]);
 const setLanguage=(next:Language)=>{setLanguageState(next);void SecureStore.setItemAsync("banglar-language",next).catch(()=>{})};
 const value=useMemo(()=>({language,setLanguage,t:(key:string)=>messages[language][key]??messages.en[key]??key}),[language]);
 return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export function useLanguage(){const value=useContext(LanguageContext);if(!value)throw new Error("useLanguage must be used inside LanguageProvider");return value;}
export function LanguageSwitcher(){const {language,setLanguage,t}=useLanguage();return <View style={styles.wrap}><Text style={styles.label}>{t("language")}</Text><View style={styles.choices}><Pressable accessibilityRole="button" accessibilityState={{selected:language==="bn"}} onPress={()=>setLanguage("bn")} style={[styles.choice,language==="bn"&&styles.active]}><Text style={[styles.choiceText,language==="bn"&&styles.activeText]}>বাংলা</Text></Pressable><Pressable accessibilityRole="button" accessibilityState={{selected:language==="en"}} onPress={()=>setLanguage("en")} style={[styles.choice,language==="en"&&styles.active]}><Text style={[styles.choiceText,language==="en"&&styles.activeText]}>English</Text></Pressable></View></View>}
const styles=StyleSheet.create({wrap:{gap:5,alignItems:"center"},label:{color:"#94A3B8",fontSize:10,fontWeight:"800"},choices:{flexDirection:"row",gap:5,padding:3,borderRadius:10,backgroundColor:"#101A2A"},choice:{paddingHorizontal:10,paddingVertical:7,borderRadius:8},active:{backgroundColor:"#FF5C00"},choiceText:{color:"#CBD5E1",fontSize:11,fontWeight:"800"},activeText:{color:"#fff"}});
