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
  "auth.errorConfig":"App connection is not configured yet. Please contact the tournament team.",
  "auth.errorRequired":"Enter your email address and password.",
  "auth.errorEmail":"Enter a valid email address.",
  "auth.errorCredentials":"Email or password is incorrect. Please try again.",
  "auth.errorGeneric":"Something went wrong. Check your connection and try again.",
  "profile.title":"Profile","profile.playerAccount":"PLAYER ACCOUNT","profile.walletPayments":"WALLET & PAYMENTS",
  "profile.player":"PLAYER ACCOUNT","profile.community":"COMMUNITY & SUPPORT","profile.myProfile":"My Profile",
  "profile.myMatch":"My Match","profile.playerCareer":"Player Career","profile.playerCareerDesc":"Your completed matches and total prize earnings","profile.results":"Results","profile.topPlayers":"Top Players","profile.rules":"All Rules",
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
  "tournaments.mode":"Mode","tournaments.map":"Map","tournaments.entry":"Entry","tournaments.status":"Status","tournaments.sort":"Sort by","tournaments.available":"Available tournaments","tournaments.error":"Could not load tournaments","tournaments.none":"No tournaments available in this category","tournaments.tryFilters":"Try changing or clearing your filters.","tournaments.resetFilters":"Reset filters","tournaments.prize":"PRIZE POOL","tournaments.slots":"SLOTS","tournaments.starts":"STARTS","tournaments.details":"VIEW DETAILS","tournaments.more":"LOAD MORE",
  "wallet.finance":"PLAYER FINANCE","wallet.title":"My Wallet","wallet.balance":"AVAILABLE BALANCE","wallet.server":"Balance is managed by the secure server-side wallet ledger.","wallet.refresh":"REFRESH BALANCE","wallet.signIn":"Sign in required","wallet.signInHint":"Log in with your website account to view your balance, deposits and withdrawals.","wallet.add":"Add Money","wallet.addHint":"Send money to the official account, then submit the sender number and transaction reference. Funds are added only after admin verification.","wallet.withdraw":"Withdraw Money","wallet.withdrawHint":"Minimum ৳100. Requested funds are reserved immediately. If admin rejects the request, the amount is returned to your wallet.","wallet.depositRequests":"Deposit Requests","wallet.withdrawRequests":"Withdrawal Requests","wallet.history":"Transaction History","wallet.noDeposits":"No deposit requests yet.","wallet.noWithdrawals":"No withdrawal requests yet.","wallet.noTransactions":"No transactions yet.","wallet.sendTo":"SEND TO OFFICIAL","wallet.notConfigured":"Not configured by admin yet","wallet.amount":"Amount in ৳","wallet.sender":"Sender mobile number","wallet.reference":"Transaction ID / reference","wallet.submitDeposit":"SUBMIT DEPOSIT REQUEST","wallet.amountMinimum":"Amount (minimum ৳100)","wallet.recipient":"Your bKash / Nagad / Rocket number","wallet.requestWithdraw":"REQUEST WITHDRAWAL",
 },
 bn:{
  "nav.home":"হোম","nav.tournaments":"টুর্নামেন্ট","nav.results":"রেজাল্ট","nav.wallet":"ওয়ালেট","nav.profile":"প্রোফাইল",
  "language":"ভাষা","language.english":"English","language.bangla":"বাংলা",
  "auth.login":"লগইন","auth.register":"রেজিস্ট্রেশন","auth.email":"ইমেইল ঠিকানা","auth.password":"পাসওয়ার্ড",
  "auth.confirmPassword":"পাসওয়ার্ড নিশ্চিত করুন","auth.forgot":"পাসওয়ার্ড ভুলে গেছেন?","auth.signIn":"সাইন ইন","auth.create":"অ্যাকাউন্ট তৈরি",
  "auth.welcome":"আবার স্বাগতম","auth.loginDescription":"টুর্নামেন্ট ও প্লেয়ার অ্যাকাউন্টে যেতে সাইন ইন করুন।",
  "auth.registerTitle":"আপনার অ্যাকাউন্ট তৈরি করুন","auth.registerDescription":"টুর্নামেন্টে যোগ দিতে এবং প্রোফাইল ম্যানেজ করতে একবার রেজিস্টার করুন।",
  "auth.newPlayer":"নতুন প্লেয়ার?","auth.already":"ইতিমধ্যে অ্যাকাউন্ট আছে?","auth.show":"দেখান","auth.hide":"লুকান",
  "auth.emailPlaceholder":"you@example.com","auth.passwordPlaceholder":"পাসওয়ার্ড লিখুন","auth.passwordHint":"কমপক্ষে ৮ অক্ষর",
  "auth.errorConfig":"অ্যাপ সংযোগ সেটআপ হয়নি। টুর্নামেন্ট টিমের সাথে যোগাযোগ করুন।",
  "auth.errorRequired":"ইমেইল ও পাসওয়ার্ড দিন।",
  "auth.errorEmail":"সঠিক ইমেইল ঠিকানা দিন।",
  "auth.errorCredentials":"ইমেইল বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।",
  "auth.errorGeneric":"কিছু সমস্যা হয়েছে। ইন্টারনেট চেক করে আবার চেষ্টা করুন।",
  "profile.title":"প্রোফাইল","profile.playerAccount":"প্লেয়ার অ্যাকাউন্ট","profile.walletPayments":"ওয়ালেট ও পেমেন্ট",
  "profile.player":"প্লেয়ার অ্যাকাউন্ট","profile.community":"কমিউনিটি ও সাপোর্ট","profile.myProfile":"আমার প্রোফাইল",
  "profile.myMatch":"আমার ম্যাচ","profile.playerCareer":"প্লেয়ার ক্যারিয়ার","profile.playerCareerDesc":"আপনার সম্পন্ন ম্যাচ ও মোট প্রাইজ আর্নিংস","profile.results":"রেজাল্ট","profile.topPlayers":"টপ প্লেয়ার","profile.rules":"সব নিয়ম",
  "profile.developer":"ডেভেলপার প্রোফাইল","profile.notifications":"নোটিফিকেশন","profile.addMoney":"টাকা যোগ",
  "profile.withdraw":"উইথড্র","profile.transactions":"লেনদেনের ইতিহাস","profile.walletDesc":"ব্যালেন্স ও ওয়ালেট অ্যাকটিভিটি দেখুন",
  "profile.addDesc":"ওয়ালেটে টাকা যোগ করুন","profile.withdrawDesc":"উইথড্র রিকোয়েস্ট করুন","profile.transactionsDesc":"ডিপোজিট ও পেমেন্ট দেখুন",
  "profile.profileDesc":"ব্যক্তিগত তথ্য ও অ্যাকাউন্ট সেটিংস","profile.matchDesc":"আপনার যোগ দেওয়া ও আসন্ন ম্যাচ",
  "profile.resultsDesc":"টুর্নামেন্ট রেজাল্ট ও পারফরম্যান্স","profile.topDesc":"লিডারবোর্ড ও র‍্যাঙ্কিং",
  "profile.rulesDesc":"টুর্নামেন্ট ও প্ল্যাটফর্মের নিয়ম","profile.developerDesc":"অ্যাপ ডেভেলপার সম্পর্কে","profile.noticeDesc":"আপনার অ্যাকাউন্ট আপডেট",
  "profile.signedIn":"প্লেয়ার অ্যাকাউন্ট","profile.welcome":"স্বাগতম, প্লেয়ার","profile.signInHint":"প্লেয়ার অ্যাকাউন্ট ও টুর্নামেন্ট সার্ভিস ব্যবহার করতে সাইন ইন করুন।",
  "profile.login":"লগইন","profile.create":"অ্যাকাউন্ট তৈরি","profile.signOut":"সাইন আউট","profile.admin":"অ্যাডমিন ড্যাশবোর্ড খুলুন",
  "match.center":"প্লেয়ার ম্যাচ সেন্টার","match.title":"আমার ম্যাচ","match.signIn":"ম্যাচ দেখতে সাইন ইন করুন।",
  "match.empty":"আপনি এখনো কোনো টুর্নামেন্টে যোগ দেননি।","match.viewRoom":"রুম ডিটেইলস দেখুন",
  "results.performance":"আপনার পারফরম্যান্স","results.title":"রেজাল্ট","results.empty":"এখনো আপনার অ্যাকাউন্টের সাথে কোনো যাচাইকৃত রেজাল্ট নেই।",
  "top.community":"কমিউনিটি র‍্যাঙ্কিং","top.title":"টপ ২০ প্লেয়ার",
  "tournaments.mode":"মোড","tournaments.map":"ম্যাপ","tournaments.entry":"এন্ট্রি ফি","tournaments.status":"স্ট্যাটাস","tournaments.sort":"সাজান","tournaments.available":"যেসব টুর্নামেন্টে যোগ দিতে পারবেন","tournaments.error":"টুর্নামেন্ট লোড করা যায়নি","tournaments.none":"এই ক্যাটাগরিতে কোনো টুর্নামেন্ট নেই","tournaments.tryFilters":"ফিল্টার পরিবর্তন করুন অথবা সব ফিল্টার রিসেট করুন।","tournaments.resetFilters":"ফিল্টার রিসেট করুন","tournaments.prize":"প্রাইজ পুল","tournaments.slots":"স্লট","tournaments.starts":"শুরু হবে","tournaments.details":"বিস্তারিত দেখুন","tournaments.more":"আরও দেখুন",
  "wallet.finance":"প্লেয়ার ফাইন্যান্স","wallet.title":"আমার ওয়ালেট","wallet.balance":"উপলব্ধ ব্যালেন্স","wallet.server":"ব্যালেন্স সুরক্ষিত সার্ভার-সাইড ওয়ালেট লেজার দিয়ে পরিচালিত।","wallet.refresh":"ব্যালেন্স রিফ্রেশ","wallet.signIn":"সাইন ইন প্রয়োজন","wallet.signInHint":"ব্যালেন্স, ডিপোজিট ও উইথড্র দেখতে ওয়েবসাইট অ্যাকাউন্ট দিয়ে লগইন করুন।","wallet.add":"টাকা যোগ","wallet.addHint":"অফিসিয়াল অ্যাকাউন্টে টাকা পাঠিয়ে প্রেরকের নম্বর ও ট্রানজেকশন রেফারেন্স জমা দিন। অ্যাডমিন যাচাইয়ের পর টাকা যোগ হবে।","wallet.withdraw":"টাকা উইথড্র","wallet.withdrawHint":"সর্বনিম্ন ৳১০০। রিকোয়েস্ট করলে টাকা আটকে রাখা হয়। অ্যাডমিন বাতিল করলে ওয়ালেটে ফিরে আসে।","wallet.depositRequests":"ডিপোজিট রিকোয়েস্ট","wallet.withdrawRequests":"উইথড্র রিকোয়েস্ট","wallet.history":"লেনদেনের ইতিহাস","wallet.noDeposits":"এখনো কোনো ডিপোজিট রিকোয়েস্ট নেই।","wallet.noWithdrawals":"এখনো কোনো উইথড্র রিকোয়েস্ট নেই।","wallet.noTransactions":"এখনো কোনো লেনদেন নেই।","wallet.sendTo":"অফিসিয়াল অ্যাকাউন্টে পাঠান","wallet.notConfigured":"অ্যাডমিন এখনো সেট করেনি","wallet.amount":"পরিমাণ ৳","wallet.sender":"প্রেরকের মোবাইল নম্বর","wallet.reference":"ট্রানজেকশন আইডি / রেফারেন্স","wallet.submitDeposit":"ডিপোজিট রিকোয়েস্ট জমা দিন","wallet.amountMinimum":"পরিমাণ (সর্বনিম্ন ৳১০০)","wallet.recipient":"আপনার বিকাশ / নগদ / রকেট নম্বর","wallet.requestWithdraw":"উইথড্র রিকোয়েস্ট",
 }
};
type LanguageContextValue={language:Language;setLanguage:(language:Language)=>void;t:Translator};
const LanguageContext=createContext<LanguageContextValue|null>(null);
export function LanguageProvider({children}:PropsWithChildren){
 const [language,setLanguageState]=useState<Language>("bn");
 useEffect(()=>{let active=true;void SecureStore.getItemAsync("banglar-language").then(value=>{if(active&&(value==="bn"||value==="en"))setLanguageState(value)}).catch(()=>{});return()=>{active=false}},[]);
 const setLanguage=(next:Language)=>{setLanguageState(next);void SecureStore.setItemAsync("banglar-language",next).catch(()=>{})};
 const value=useMemo(()=>({language,setLanguage,t:(key:string)=>messages[language][key]??messages.bn[key]??messages.en[key]??key}),[language]);
 return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export function useLanguage(){const value=useContext(LanguageContext);if(!value)throw new Error("useLanguage must be used inside LanguageProvider");return value;}
export function LanguageSwitcher(){const {language,setLanguage,t}=useLanguage();return <View style={styles.wrap}><Text style={styles.label}>{t("language")}</Text><View style={styles.choices}><Pressable accessibilityRole="button" accessibilityState={{selected:language==="bn"}} onPress={()=>setLanguage("bn")} style={[styles.choice,language==="bn"&&styles.active]}><Text style={[styles.choiceText,language==="bn"&&styles.activeText]}>বাংলা</Text></Pressable><Pressable accessibilityRole="button" accessibilityState={{selected:language==="en"}} onPress={()=>setLanguage("en")} style={[styles.choice,language==="en"&&styles.active]}><Text style={[styles.choiceText,language==="en"&&styles.activeText]}>English</Text></Pressable></View></View>}
const styles=StyleSheet.create({wrap:{gap:5,alignItems:"center"},label:{color:"#94A3B8",fontSize:10,fontWeight:"800"},choices:{flexDirection:"row",gap:5,padding:3,borderRadius:10,backgroundColor:"#101A2A"},choice:{paddingHorizontal:10,paddingVertical:7,borderRadius:8},active:{backgroundColor:"#FF5C00"},choiceText:{color:"#CBD5E1",fontSize:11,fontWeight:"800"},activeText:{color:"#fff"}});
