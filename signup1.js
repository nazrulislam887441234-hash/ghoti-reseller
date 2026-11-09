
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


/* =========================================
   FIREBASE CONFIGURATION
========================================= */

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


/* =========================================
   CONFIGURATION
========================================= */

const WORKER_URL = "https://reseller-notification.ghotimarket.com";

const PRIVACY_URL = "https://reseller.ghotimarket.com/privacy-policy";

// Terms পেজের URL আলাদা হলে এখানে পরিবর্তন করবে।
const TERMS_URL = "https://reseller.ghotimarket.com/terms";

const POLICY_VERSION = "1.0";


/* =========================================
   DOM ELEMENTS
========================================= */

const pageLoader = document.getElementById("pageLoader");

const profileForm = document.getElementById("profileForm");

const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const whatsappInput = document.getElementById("whatsapp");

const nameError = document.getElementById("nameError");
const phoneError = document.getElementById("phoneError");
const whatsappError = document.getElementById("whatsappError");

const policyAgreement = document.getElementById("policyAgreement");
const agreementError = document.getElementById("agreementError");

const submitBtn = document.getElementById("submitBtn");
const btnText = submitBtn.querySelector(".btn-text");
const spinner = submitBtn.querySelector(".spinner");

const toastContainer = document.getElementById("toastContainer");

// Policy Overlay
const policyOverlay = document.getElementById("policyOverlay");
const policyFrame = document.getElementById("policyFrame");
const policyTitle = document.getElementById("policyTitle");

const privacyLink = document.getElementById("privacyLink");
const termsLink = document.getElementById("termsLink");
const closePolicy = document.getElementById("closePolicy");


/* =========================================
   GLOBAL VARIABLES
========================================= */

let currentUser = null;
let isSubmitting = false;


/* =========================================
   PAGE LOADER
========================================= */

function hidePageLoader() {

    pageLoader.style.opacity = "0";

    setTimeout(() => {
        pageLoader.style.display = "none";
    }, 300);

}


/* =========================================
   CUSTOM TOAST
========================================= */

function showToast(message, type = "info") {

    const toast = document.createElement("div");

    toast.className = `custom-toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);

}


/* =========================================
   PHONE NUMBER VALIDATION
========================================= */

function normalizeAndValidatePhone(inputVal) {

    let cleaned = inputVal.replace(/\D/g, "");

    if (cleaned.startsWith("880")) {
        cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith("88") && cleaned.length > 10) {
        cleaned = cleaned.substring(2);
    }

    const isValid = /^01[3-9]\d{8}$/.test(cleaned);

    return {
        cleaned,
        isValid
    };

}


/* =========================================
   PHONE INPUT CLEANUP
========================================= */

function setupPhoneInput(inputElement) {

    inputElement.addEventListener("input", (e) => {

        let value = e.target.value.replace(/\D/g, "");

        if (value.startsWith("880")) {
            value = value.substring(2);
        } else if (value.startsWith("88") && value.length > 10) {
            value = value.substring(2);
        }

        e.target.value = value;

    });

}

setupPhoneInput(phoneInput);
setupPhoneInput(whatsappInput);


/* =========================================
   POLICY AGREEMENT
========================================= */

// Checkbox পরিবর্তন করলে Error মুছে যাবে।
policyAgreement.addEventListener("change", () => {

    if (policyAgreement.checked) {
        agreementError.textContent = "";
    }

});


/* =========================================
   POLICY OVERLAY
========================================= */

function openPolicy(title, url) {

    policyTitle.textContent = title;

    policyFrame.src = url;

    policyOverlay.classList.add("active");

    document.body.style.overflow = "hidden";

}


function closePolicyModal() {

    policyOverlay.classList.remove("active");

    policyFrame.src = "about:blank";

    document.body.style.overflow = "";

}


// Privacy Policy
privacyLink.addEventListener("click", (e) => {

    e.preventDefault();

    openPolicy(
        "প্রাইভেসি পলিসি",
        PRIVACY_URL
    );

});


// Terms & Conditions
termsLink.addEventListener("click", (e) => {

    e.preventDefault();

    openPolicy(
        "শর্তাবলী / Terms & Conditions",
        TERMS_URL
    );

});


// Close Button
closePolicy.addEventListener("click", closePolicyModal);


// Outside Click
policyOverlay.addEventListener("click", (e) => {

    if (e.target === policyOverlay) {
        closePolicyModal();
    }

});


// Escape Key
document.addEventListener("keydown", (e) => {

    if (e.key === "Escape" && policyOverlay.classList.contains("active")) {
        closePolicyModal();
    }

});


/* =========================================
   AUTHENTICATION CHECK
========================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "/signup";

        return;

    }

    currentUser = user;

    try {

        const docRef = doc(db, "reseller", user.uid);

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {

            window.location.href = "/dashboard";

            return;

        }

        hidePageLoader();

    } catch (error) {

        console.error("Firestore Check Error:", error);

        showToast(
            "ডেটা যাচাই করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
            "error"
        );

        hidePageLoader();

    }

});


/* =========================================
   FORM SUBMISSION
========================================= */

profileForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (isSubmitting || !currentUser) return;


    /* Clear Previous Errors */

    nameError.textContent = "";
    phoneError.textContent = "";
    whatsappError.textContent = "";
    agreementError.textContent = "";


    /* Get Input Values */

    const name = nameInput.value.trim();

    const phoneData = normalizeAndValidatePhone(phoneInput.value);

    const whatsappData = normalizeAndValidatePhone(whatsappInput.value);


    let isValid = true;


    /* Name Validation */

    if (!name) {

        nameError.textContent = "পুরো নাম আবশ্যক।";

        isValid = false;

    }


    /* Phone Validation */

    if (!phoneData.isValid) {

        phoneError.textContent =
            "সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01712345678)।";

        isValid = false;

    }


    /* WhatsApp Validation */

    if (!whatsappData.isValid) {

        whatsappError.textContent =
            "সঠিক ১১ ডিজিটের হোয়াটসঅ্যাপ নম্বর দিন।";

        isValid = false;

    }


    /* Policy Agreement Validation */

    if (!policyAgreement.checked) {

        agreementError.textContent =
            "নিবন্ধন করতে প্রাইভেসি পলিসি ও শর্তাবলীতে সম্মতি দিতে হবে।";

        isValid = false;

    }


    // Validation Failed
    if (!isValid) {

        if (!name) {
            nameInput.focus();
        } else if (!phoneData.isValid) {
            phoneInput.focus();
        } else if (!whatsappData.isValid) {
            whatsappInput.focus();
        } else if (!policyAgreement.checked) {
            policyAgreement.focus();
        }

        return;

    }


    /* Start Submission */

    isSubmitting = true;

    submitBtn.disabled = true;

    btnText.style.display = "none";

    spinner.style.display = "block";


    try {

        const uid = currentUser.uid;

        const email = currentUser.email;


        /* Double Check Existing Profile */

        const docRef = doc(db, "reseller", uid);

        const docSnap = await getDoc(docRef);


        if (docSnap.exists()) {

            showToast(
                "এই একাউন্টের প্রোফাইল ইতিমধ্যে তৈরি হয়েছে।",
                "error"
            );

            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 1500);

            return;

        }


        /* Final Agreement Check */

        if (!policyAgreement.checked) {

            throw new Error("POLICY_NOT_ACCEPTED");

        }


        /* Profile Data */

        const profileData = {

            name: name,

            phone: phoneData.cleaned,

            whatsApp: whatsappData.cleaned,

            email: email,

            uid: uid,

            active: false,

            balance: 0,

            verified: false,


            // Privacy Policy & Terms Agreement

            policyAccepted: true,

            policyAcceptedAt: serverTimestamp(),

            policyVersion: POLICY_VERSION,


            // Account Creation Time

            createdAt: serverTimestamp()

        };


        /* Save to Firestore */

        await setDoc(docRef, profileData);


        showToast(
            "নিবন্ধন সফলভাবে সম্পন্ন হয়েছে!",
            "success"
        );


        /* =========================================
           CLOUDFLARE WORKER NOTIFICATION
        ========================================= */

        fetch(WORKER_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                name: profileData.name,

                phone: profileData.phone,

                whatsApp: profileData.whatsApp,

                email: profileData.email,

                uid: profileData.uid

            })

        }).catch((error) => {

            console.error(
                "Worker Notification Error:",
                error
            );

        });


        /* Redirect */

        setTimeout(() => {

            window.location.href = "/complete";

        }, 1500);


    } catch (error) {

        console.error("Profile Save Error:", error);


        if (error.message === "POLICY_NOT_ACCEPTED") {

            agreementError.textContent =
                "প্রাইভেসি পলিসি ও শর্তাবলীতে সম্মতি দিন।";

        } else {

            showToast(
                "প্রোফাইল সংরক্ষণ করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।",
                "error"
            );

        }


        /* Reset Button */

        isSubmitting = false;

        submitBtn.disabled = false;

        btnText.style.display = "inline";

        spinner.style.display = "none";

    }

});
