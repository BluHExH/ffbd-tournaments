import {useCallback,useEffect,useState} from "react";
import {ActivityIndicator,Pressable,StyleSheet,Text,TextInput,View} from "react-native";
import {Card,Heading,Muted,Subheading,Button} from "@/components/UI";
import {Screen} from "@/components/Screen";
import {supabase} from "@/lib/supabase";
import {theme} from "@/lib/theme";

type Method="bKash"|"Nagad"|"Rocket";
type Tx={id:string;transaction_type:string;direction:string;amount_paisa:number;status:string;description:string|null;created_at:string};
type RequestRow={id:string;amount_paisa:number;payment_method:string;status:string;created_at:string};
const methods:Method[]=["bKash","Nagad","Rocket"];
const money=(paisa:number)=>"৳"+(Number(paisa||0)/100).toLocaleString("en-BD",{minimumFractionDigits:2,maximumFractionDigits:2});
const statusColor=(status:string)=>status==="approved"||status==="completed"?"#22C55E":status==="rejected"||status==="failed"?"#F87171":"#FBBF24";

function MethodPicker({value,onChange}:{value:Method;onChange:(v:Method)=>void}){
 return <View style={s.methods}>{methods.map(method=><Pressable key={method} onPress={()=>onChange(method)} style={[s.method,value===method&&s.methodActive]}><Text style={[s.methodText,value===method&&s.methodTextActive]}>{method}</Text></Pressable>)}</View>;
}
export default function Wallet(){
 const [userId,setUserId]=useState<string|null>(null);
 const [balance,setBalance]=useState(0);
 const [transactions,setTransactions]=useState<Tx[]>([]);
 const [deposits,setDeposits]=useState<RequestRow[]>([]);
 const [withdrawals,setWithdrawals]=useState<RequestRow[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [depositAmount,setDepositAmount]=useState("");
 const [sender,setSender]=useState("");
 const [reference,setReference]=useState("");
 const [depositMethod,setDepositMethod]=useState<Method>("bKash");
 const [withdrawAmount,setWithdrawAmount]=useState("");
 const [recipient,setRecipient]=useState("");
 const [withdrawMethod,setWithdrawMethod]=useState<Method>("bKash");
 const [paymentAccounts,setPaymentAccounts]=useState<Record<Method,string>>({bKash:"",Nagad:"",Rocket:""});

 const load=useCallback(async()=>{
  if(!supabase){setLoading(false);setError("App connection is not configured.");return}
  setLoading(true);setError("");
  const {data:userData,error:userError}=await supabase.auth.getUser();
  if(userError||!userData.user){setUserId(null);setLoading(false);return}
  const id=userData.user.id;setUserId(id);
  const [account,tx,dep,wd,settings]=await Promise.all([
   supabase.from("wallet_accounts").select("balance_paisa").eq("user_id",id).maybeSingle(),
   supabase.from("wallet_transactions").select("id,transaction_type,direction,amount_paisa,status,description,created_at").eq("user_id",id).order("created_at",{ascending:false}).limit(30),
   supabase.from("wallet_deposit_requests").select("id,amount_paisa,payment_method,status,created_at").eq("user_id",id).order("created_at",{ascending:false}).limit(10),
   supabase.from("wallet_withdrawal_requests").select("id,amount_paisa,payment_method,status,created_at").eq("user_id",id).order("created_at",{ascending:false}).limit(10),
   supabase.from("website_settings").select("key,value").in("key",["payment_bkash_number","payment_nagad_number","payment_rocket_number"])
  ]);
  const failure=account.error||tx.error||dep.error||wd.error||settings.error;
  if(failure)setError(failure.message);
  setBalance(Number(account.data?.balance_paisa??0));
  setTransactions((tx.data??[]) as Tx[]);
  setDeposits((dep.data??[]) as RequestRow[]);
  setWithdrawals((wd.data??[]) as RequestRow[]);
  const configured=Object.fromEntries((settings.data??[]).map(row=>[row.key.replace("payment_","").replace("_number","").replace(/^./,v=>v.toUpperCase()),row.value]));
  setPaymentAccounts({bKash:String(configured.bKash??""),Nagad:String(configured.Nagad??""),Rocket:String(configured.Rocket??"")});
  setLoading(false);
 },[]);
 useEffect(()=>{void load()},[load]);

 const submitDeposit=async()=>{
  setError("");setMessage("");
  const amount=Number(depositAmount);
  if(!supabase||!userId){setError("Please sign in to use your wallet.");return}
  if(!paymentAccounts[depositMethod].trim()){setError("This payment method is not configured yet. Please contact the admin.");return}
  if(!Number.isFinite(amount)||amount<=0||!sender.trim()||!reference.trim()){setError("Enter a valid amount, sender number and transaction reference.");return}
  setBusy(true);
  const {error:rpcError}=await supabase.rpc("submit_wallet_deposit",{p_amount_paisa:Math.round(amount*100),p_payment_method:depositMethod,p_sender_number:sender.trim(),p_transaction_reference:reference.trim()});
  setBusy(false);
  if(rpcError){setError(rpcError.message);return}
  setMessage("Deposit request submitted. Your wallet will update after admin verification.");
  setDepositAmount("");setSender("");setReference("");await load();
 };
 const submitWithdrawal=async()=>{
  setError("");setMessage("");
  const amount=Number(withdrawAmount);
  if(!supabase||!userId){setError("Please sign in to use your wallet.");return}
  if(!Number.isFinite(amount)||amount<100||!recipient.trim()){setError("Minimum withdrawal is ৳100. Enter a valid recipient number.");return}
  setBusy(true);
  const {error:rpcError}=await supabase.rpc("request_wallet_withdrawal",{p_amount_paisa:Math.round(amount*100),p_payment_method:withdrawMethod,p_recipient_number:recipient.trim()});
  setBusy(false);
  if(rpcError){setError(rpcError.message);return}
  setMessage("Withdrawal request submitted. The amount is reserved until admin review.");
  setWithdrawAmount("");setRecipient("");await load();
 };
 if(!userId&&!loading)return <Screen><Muted>PLAYER FINANCE</Muted><Heading>My Wallet</Heading><Card><Subheading>Sign in required</Subheading><Muted>Log in with your website account to view your balance, deposits and withdrawals.</Muted></Card></Screen>;
 return <Screen>
  <Muted>PLAYER FINANCE</Muted><Heading>My Wallet</Heading>
  <Card><Muted>AVAILABLE BALANCE</Muted><Heading>{loading?"…":money(balance)}</Heading><Muted>Balance is managed by the secure server-side wallet ledger.</Muted><Button onPress={()=>void load()} disabled={loading}>REFRESH BALANCE</Button></Card>
  {error?<Text accessibilityRole="alert" style={s.error}>{error}</Text>:null}
  {message?<Text accessibilityRole="alert" style={s.success}>{message}</Text>:null}
  <Card><Subheading>Add Money</Subheading><Muted>Send money to the official account, then submit the sender number and transaction reference. Funds are added only after admin verification.</Muted><MethodPicker value={depositMethod} onChange={setDepositMethod}/><View style={s.paymentAccount}><Text style={s.paymentAccountLabel}>SEND TO OFFICIAL {depositMethod.toUpperCase()} NUMBER</Text><Text selectable style={s.paymentAccountNumber}>{paymentAccounts[depositMethod]||"Not configured by admin yet"}</Text><Text style={s.date}>{paymentAccounts[depositMethod]?"Send money to this number, then enter your sender number and transaction ID below.":"Do not send money until the admin adds the official receiving number in Admin → Website Settings."}</Text></View><TextInput value={depositAmount} onChangeText={setDepositAmount} keyboardType="decimal-pad" placeholder="Amount in ৳" placeholderTextColor={theme.muted} style={s.input}/><TextInput value={sender} onChangeText={setSender} keyboardType="phone-pad" placeholder="Sender mobile number" placeholderTextColor={theme.muted} style={s.input}/><TextInput value={reference} onChangeText={setReference} autoCapitalize="characters" placeholder="Transaction ID / reference" placeholderTextColor={theme.muted} style={s.input}/><Button loading={busy} disabled={!paymentAccounts[depositMethod].trim()} onPress={submitDeposit}>SUBMIT DEPOSIT REQUEST</Button></Card>
  <Card><Subheading>Withdraw Money</Subheading><Muted>Minimum ৳100. Requested funds are reserved immediately. If admin rejects the request, the amount is returned to your wallet.</Muted><MethodPicker value={withdrawMethod} onChange={setWithdrawMethod}/><TextInput value={withdrawAmount} onChangeText={setWithdrawAmount} keyboardType="decimal-pad" placeholder="Amount (minimum ৳100)" placeholderTextColor={theme.muted} style={s.input}/><TextInput value={recipient} onChangeText={setRecipient} keyboardType="phone-pad" placeholder="Your bKash / Nagad / Rocket number" placeholderTextColor={theme.muted} style={s.input}/><Button loading={busy} onPress={submitWithdrawal}>REQUEST WITHDRAWAL</Button></Card>
  <Card><Subheading>Deposit Requests</Subheading>{loading?<ActivityIndicator color={theme.accent}/>:deposits.length?deposits.map(item=><View key={item.id} style={s.historyRow}><View style={s.historyCopy}><Text style={s.historyTitle}>{item.payment_method} deposit · {money(item.amount_paisa)}</Text><Text style={s.date}>{new Date(item.created_at).toLocaleString()}</Text></View><Text style={[s.status,{color:statusColor(item.status)}]}>{item.status.toUpperCase()}</Text></View>):<Muted>No deposit requests yet.</Muted>}</Card>
  <Card><Subheading>Withdrawal Requests</Subheading>{loading?<ActivityIndicator color={theme.accent}/>:withdrawals.length?withdrawals.map(item=><View key={item.id} style={s.historyRow}><View style={s.historyCopy}><Text style={s.historyTitle}>{item.payment_method} withdrawal · {money(item.amount_paisa)}</Text><Text style={s.date}>{new Date(item.created_at).toLocaleString()}</Text></View><Text style={[s.status,{color:statusColor(item.status)}]}>{item.status.toUpperCase()}</Text></View>):<Muted>No withdrawal requests yet.</Muted>}</Card>
  <Card><Subheading>Transaction History</Subheading>{loading?<ActivityIndicator color={theme.accent}/>:transactions.length?transactions.map(item=><View key={item.id} style={s.historyRow}><View style={s.historyCopy}><Text style={s.historyTitle}>{item.description||item.transaction_type.replaceAll("_"," ")}</Text><Text style={s.date}>{new Date(item.created_at).toLocaleString()} · {item.status}</Text></View><Text style={[s.amount,{color:item.direction==="credit"?"#22C55E":"#F87171"}]}>{item.direction==="credit"?"+":"−"}{money(item.amount_paisa)}</Text></View>):<Muted>No transactions yet.</Muted>}</Card>
 </Screen>;
}
const s=StyleSheet.create({methods:{flexDirection:"row",gap:8},paymentAccount:{padding:12,borderRadius:10,borderWidth:1,borderColor:theme.border,backgroundColor:"#0B1221",gap:5},paymentAccountLabel:{color:theme.accent,fontSize:9,fontWeight:"900",letterSpacing:.7},paymentAccountNumber:{color:"#fff",fontSize:17,fontWeight:"900"},method:{flex:1,paddingVertical:11,borderRadius:10,alignItems:"center",borderWidth:1,borderColor:theme.border,backgroundColor:"#0B1221"},methodActive:{borderColor:theme.accent,backgroundColor:"rgba(255,92,0,.14)"},methodText:{color:theme.muted,fontSize:12,fontWeight:"800"},methodTextActive:{color:theme.accent},input:{minHeight:46,borderWidth:1,borderColor:theme.border,borderRadius:11,paddingHorizontal:13,color:"#fff",backgroundColor:"#0B1221"},error:{color:"#FCA5A5",fontSize:13},success:{color:"#86EFAC",fontSize:13},historyRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12,paddingVertical:11,borderBottomWidth:1,borderBottomColor:theme.border},historyCopy:{flex:1,gap:4},historyTitle:{color:"#fff",fontSize:12,fontWeight:"800"},date:{color:theme.muted,fontSize:10},status:{fontSize:9,fontWeight:"900"},amount:{fontSize:12,fontWeight:"900"}});
