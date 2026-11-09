// ซิงค์ข้อมูลกับ Firebase (Auth: Google, Firestore: users/{uid}) และล็อกหน้าแอปจนกว่าจะเข้าสู่ระบบ
// ถ้ายังไม่ตั้งค่า firebase-config.js แอปจะทำงานแบบเก็บในเครื่องโดยไม่มีหน้าล็อกอิน
import { firebaseConfig } from './firebase-config.js';

const $ = (id) => document.getElementById(id);
const msg = $('cloudMsg'), who = $('cloudUser'), stat = $('cloudStatus');
const bin = $('btnSignIn'), bout = $('btnSignOut');
const gateIn = $('gateSignIn'), gateRetry = $('gateRetry'), gateMsg = $('gateMsg');
const SDK = 'https://www.gstatic.com/firebasejs/10.14.1/';

function setMsg(t) { msg.textContent = t; }
function setStat(t) { stat.textContent = t; }
function lock(on) { document.body.classList.toggle('locked', on); }
gateRetry.onclick = () => location.reload();

(async function () {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('YOUR_')) {
    setMsg('ยังไม่ได้ตั้งค่า Firebase ตอนนี้ข้อมูลเก็บในเครื่องนี้เท่านั้น (ดูวิธีตั้งค่าใน README.md)');
    lock(false);
    return;
  }
  let fb;
  try {
    const [app, auth, fs] = await Promise.all([
      import(SDK + 'firebase-app.js'),
      import(SDK + 'firebase-auth.js'),
      import(SDK + 'firebase-firestore.js'),
    ]);
    fb = { app, auth, fs };
  } catch (e) {
    gateMsg.textContent = 'เชื่อมต่อ Firebase ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วกด "ลองใหม่"';
    gateRetry.hidden = false;
    return; // คงหน้าล็อกไว้
  }

  const app = fb.app.initializeApp(firebaseConfig);
  const auth = fb.auth.getAuth(app);
  const db = fb.fs.getFirestore(app);
  let user = null, timer = null, applying = false;

  const ref = () => fb.fs.doc(db, 'users', user.uid);

  async function push() {
    if (!user) return;
    try {
      setStat('กำลังบันทึกขึ้นคลาวด์...');
      await fb.fs.setDoc(ref(), {
        json: JSON.stringify(window.App.get()),
        updatedAt: fb.fs.serverTimestamp(),
      });
      setStat('ซิงค์แล้ว ' + new Date().toLocaleTimeString('th-TH'));
    } catch (e) {
      setStat('บันทึกขึ้นคลาวด์ไม่สำเร็จ: ' + (e.code || e.message));
    }
  }

  window.App.onSaved = function () {
    if (!user || applying) return;
    clearTimeout(timer);
    timer = setTimeout(push, 1200);
  };

  function hasLocalData(s) {
    return s && !s.sample && ((s.debts && s.debts.length) || (s.ideas && s.ideas.length) || (s.log && s.log.length));
  }

  async function pull() {
    try {
      setStat('กำลังโหลดข้อมูลจากคลาวด์...');
      const snap = await fb.fs.getDoc(ref());
      if (!snap.exists()) { await push(); return; }
      const remote = JSON.parse(snap.data().json);
      if (hasLocalData(window.App.get()) &&
          !confirm('พบข้อมูลบนคลาวด์ และมีข้อมูลในเครื่องนี้ด้วย\n\nOK = ใช้ข้อมูลจากคลาวด์ (ข้อมูลในเครื่องจะถูกแทนที่)\nCancel = ใช้ข้อมูลในเครื่อง (อัปโหลดทับคลาวด์)')) {
        await push(); return;
      }
      applying = true;
      window.App.set(remote);
      applying = false;
      setStat('ซิงค์แล้ว ' + new Date().toLocaleTimeString('th-TH'));
    } catch (e) {
      applying = false;
      setStat('โหลดข้อมูลไม่สำเร็จ: ' + (e.code || e.message));
    }
  }

  async function signIn() {
    gateMsg.textContent = '';
    try { await fb.auth.signInWithPopup(auth, new fb.auth.GoogleAuthProvider()); }
    catch (e) {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
        await fb.auth.signInWithRedirect(auth, new fb.auth.GoogleAuthProvider());
      } else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        gateMsg.textContent = 'เข้าสู่ระบบไม่สำเร็จ: ' + (e.code || e.message);
        setStat('เข้าสู่ระบบไม่สำเร็จ: ' + (e.code || e.message));
      }
    }
  }
  bin.onclick = signIn;
  gateIn.onclick = signIn;
  bout.onclick = () => fb.auth.signOut(auth);

  fb.auth.onAuthStateChanged(auth, async (u) => {
    user = u;
    bin.hidden = !!u;
    bout.hidden = !u;
    if (u) {
      lock(false);
      setMsg('ข้อมูลจะซิงค์กับบัญชีนี้อัตโนมัติทุกครั้งที่แก้ไข');
      who.textContent = u.displayName ? u.displayName + ' (' + u.email + ')' : u.email;
      await pull();
    } else {
      // ออกจากระบบ: ล็อกหน้าและลบข้อมูลที่ค้างในเครื่องนี้ (ข้อมูลบนคลาวด์ยังอยู่)
      clearTimeout(timer);
      window.App.wipe();
      who.textContent = '';
      setStat('');
      setMsg('ยังไม่ได้เข้าสู่ระบบ');
      lock(true);
      gateMsg.textContent = '';
      gateIn.hidden = false;
    }
  });
})();
