-- Import the original 12 public demo tournaments without deleting or overwriting
-- any existing database records. Safe to run more than once.
INSERT INTO public.tournaments
  (uid, slug, title, title_bn, mode, entry_fee, prize_pool, slots, slots_filled, status, start_at, cover, region, map)
VALUES
  ('#FF001','ffbd-weekly-solo-cup','FFBD Weekly Solo Cup','এফএফবিডি উইকলি সোলো কাপ','Solo',0,15000,48,41,'live',now()+interval '45 minutes',null,'BD','Bermuda'),
  ('#FF002','night-squad-championship','Night Squad Championship','নাইট স্কোয়াড চ্যাম্পিয়নশিপ','Squad',100,50000,24,18,'upcoming',now()+interval '5 hours',null,'BD','Bermuda'),
  ('#FF003','duo-rush-friday','Duo Rush Friday','ডুও রাশ ফ্রাইডে','Duo',50,25000,36,29,'upcoming',now()+interval '28 hours',null,'BD','Purgatory'),
  ('#FF004','free-entry-squad-clash','Free Entry Squad Clash','ফ্রি এন্ট্রি স্কোয়াড ক্ল্যাশ','Squad',0,20000,20,12,'upcoming',now()+interval '50 hours',null,'BD','Kalahari'),
  ('#FF005','pro-solo-showdown','Pro Solo Showdown','প্রো সোলো শোডাউন','Solo',80,35000,48,48,'ended',now()-interval '24 hours',null,'BD','Alpine'),
  ('#FF006','weekend-grand-squad','Weekend Grand Squad','উইকেন্ড গ্র্যান্ড স্কোয়াড','Squad',150,100000,16,9,'upcoming',now()+interval '72 hours',null,'BD','Bermuda'),
  ('#FF007','midnight-solo-blitz','Midnight Solo Blitz','মিডনাইট সোলো ব্লিটজ','Solo',30,12000,48,22,'upcoming',now()+interval '12 hours',null,'BD','Purgatory'),
  ('#FF008','dhaka-duo-open','Dhaka Duo Open','ঢাকা ডুও ওপেন','Duo',0,18000,40,31,'live',now()+interval '90 minutes',null,'BD','Bermuda'),
  ('#FF009','kalahari-squad-wars','Kalahari Squad Wars','কালাহারি স্কোয়াড ওয়ার্স','Squad',120,60000,20,20,'ended',now()-interval '48 hours',null,'BD','Kalahari'),
  ('#FF010','alpine-pro-duo','Alpine Pro Duo','আলপাইন প্রো ডুও','Duo',70,28000,32,14,'upcoming',now()+interval '36 hours',null,'BD','Alpine'),
  ('#FF011','free-solo-friday','Free Solo Friday','ফ্রি সোলো ফ্রাইডে','Solo',0,10000,48,8,'upcoming',now()+interval '96 hours',null,'BD','Bermuda'),
  ('#FF012','champions-squad-final','Champions Squad Final','চ্যাম্পিয়নস স্কোয়াড ফাইনাল','Squad',200,150000,12,6,'upcoming',now()+interval '120 hours',null,'BD','Purgatory')
ON CONFLICT DO NOTHING;
