import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDCIRWmozT0XcEXuXtQ6RDiDo6vtT1T9mU",
  authDomain: "paikarisell-ghotimarket.firebaseapp.com",
  projectId: "paikarisell-ghotimarket",
  storageBucket: "paikarisell-ghotimarket.firebasestorage.app",
  messagingSenderId: "464086432830",
  appId: "1:464086432830:web:a10fdd9884954e380e656f",
  measurementId: "G-E3HR2F9TC5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Cloudflare Worker Endpoint URL (Change this to your actual deployed worker URL)
const WORKER_URL = "https://reseller-notification.ghotimarket.com";

const pageLoader = document.getElementById('pageLoader');
const profileForm = document.getElementById('profileForm');
const nameInput = document.getElementById('name');
const phoneInput = document.getElementById('phone');
const whatsappInput = document.getElementById('whatsapp');
const nameError = document.getElementById('nameError');
const phoneError = document.getElementById('phoneError');
const whatsappError = document.getElementById('whatsappError');
const submitBtn = document.getElementById('submitBtn');
const btnText = submitBtn.querySelector('.btn-text');
const spinner = submitBtn.querySelector('.spinner');
const toastContainer = document.getElementById('toastContainer');

let currentUser = null;
let isSubmitting = false;

// Custom Toast Notification Function
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Bangladeshi Phone Number Normalizer & Validator
function normalizeAndValidatePhone(inputVal) {
    let cleaned = inputVal.replace(/[^\d]/g, '');
    if (cleaned.startsWith('88')) {
        cleaned = cleaned.substring(2);
    }
    if (cleaned.startsWith('+88')) {
        cleaned = cleaned.substring(3);
    }
    // If user typed with leading country code variations
    if (cleaned.length > 11 && cleaned.startsWith('880')) {
        cleaned = cleaned.substring(2);
    }

    const isValid = /^01[3-9]\d{8}$/.test(cleaned);
    return { cleaned, isValid };
}

// Real-time phone input cleanup
function setupPhoneInput(inputElement) {
    inputElement.addEventListener('input', (e) => {
        let val = e.target.value.replace(/[^\d]/g, '');
        if (val.startsWith('880')) {
            val = val.substring(2);
        } else if (val.startsWith('88') && val.length > 10) {
            val = val.substring(2);
        }
        e.target.value = val;
    });
}

setupPhoneInput(phoneInput);
setupPhoneInput(whatsappInput);

// Authentication Check on Load
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '/signup';
        return;
    }

    currentUser = user;

    try {
        const docRef = doc(db, "reseller", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            window.location.href = '/dashboard';
        } else {
            // Hide Loader, Show Form
            pageLoader.style.opacity = '0';
            setTimeout(() => {
                pageLoader.style.display = 'none';
            }, 300);
        }
    } catch (error) {
        console.error("Firestore Check Error:", error);
        showToast('ডেটা যাচাই করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'error');
        pageLoader.style.opacity = '0';
        setTimeout(() => {
            pageLoader.style.display = 'none';
        }, 300);
    }
});

// Profile Form Submission
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting || !currentUser) return;

    nameError.textContent = '';
    phoneError.textContent = '';
    whatsappError.textContent = '';

    const name = nameInput.value.trim();
    const phoneData = normalizeAndValidatePhone(phoneInput.value);
    const whatsappData = normalizeAndValidatePhone(whatsappInput.value);

    let isValid = true;

    if (!name) {
        nameError.textContent = 'পুরো নাম আবশ্যক।';
        isValid = false;
    }

    if (!phoneData.isValid) {
        phoneError.textContent = 'সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01712345678)।';
        isValid = false;
    }

    if (!whatsappData.isValid) {
        whatsappError.textContent = 'সঠিক ১১ ডিজিটের হোয়াটসঅ্যাপ নম্বর দিন।';
        isValid = false;
    }

    if (!isValid) return;

    isSubmitting = true;
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'block';

    try {
        const uid = currentUser.uid;
        const email = currentUser.email;

        // Double check if document already exists
        const docRef = doc(db, "reseller", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            showToast('এই একাউন্টের প্রোফাইল ইতিমধ্যে তৈরি হয়েছে।', 'error');
            setTimeout(() => {
                window.location.href = '/complete';
            }, 1500);
            return;
        }

        const profileData = {
            name: name,
            phone: phoneData.cleaned,
            whatsApp: whatsappData.cleaned,
            email: email,
            uid: uid,
            active: false,
            balance: 0,  
            verified: false,
            createdAt: serverTimestamp()
        };

        // Save to Firestore
        await setDoc(docRef, profileData);

        showToast('নিবন্ধন সফলভাবে সম্পন্ন হয়েছে!', 'success');

        // Send Telegram Notification via Cloudflare Worker (Non-blocking / Background safe)
        try {
            fetch(WORKER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: profileData.name,
                    phone: profileData.phone,
                    WhatsApp: profileData.WhatsApp,
                    email: profileData.email,
                    uid: profileData.uid
                })
            }).catch(err => console.error("Worker Notification Error:", err));
        } catch (workerErr) {
            console.error("Worker trigger failed:", workerErr);
        }

        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 1500);

    } catch (error) {
        console.error("Profile Save Error:", error);
        showToast('প্রোফাইল সংরক্ষণ করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', 'error');
        isSubmitting = false;
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
});
