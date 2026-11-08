// 1. Firebase Configuration Setup
const firebaseConfig = {
  apiKey: "AIzaSyDCIRWmozT0XcEXuXtQ6RDiDo6vtT1T9mU",
  authDomain: "paikarisell-ghotimarket.firebaseapp.com",
  projectId: "paikarisell-ghotimarket",
  storageBucket: "paikarisell-ghotimarket.firebasestorage.app",
  messagingSenderId: "464086432830",
  appId: "1:464086432830:web:a10fdd9884954e380e656f",
  measurementId: "G-E3HR2F9TC5"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// 2. Custom Toast System (No browser native alert)
function showToast(message, type = 'error') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// 3. Authentication & Firestore Routing System
function handleAuthRouting() {
  const loader = document.getElementById('app-loader');

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const resellerDoc = await db.collection('resellers').doc(user.uid).get();
        if (resellerDoc.exists) {
          // Scenario A: Logged in & exists in resellers collection -> /dashboard
          window.location.href = '/dashboard';
        } else {
          // Scenario B: Logged in but missing reseller document -> /signup1
          window.location.href = '/signup1';
        }
      } catch (error) {
        console.error("Firestore Verification Error:", error);
        showToast("ডাটাবেজ সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
        if (loader) loader.classList.add('fade-out');
      }
    } else {
      // Scenario C: Not logged in -> Show homepage naturally
      if (loader) {
        loader.classList.add('fade-out');
      }
    }
  });
}

// 4. Mobile Menu Navigation Handler
function initMobileMenu() {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const menuIcon = hamburgerBtn.querySelector('.menu-icon');
  const closeIcon = hamburgerBtn.querySelector('.close-icon');

  if (!hamburgerBtn || !mobileDrawer) return;

  hamburgerBtn.addEventListener('click', () => {
    const isOpen = mobileDrawer.classList.contains('open');
    if (isOpen) {
      mobileDrawer.classList.remove('open');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      menuIcon.classList.remove('hidden');
      closeIcon.classList.add('hidden');
    } else {
      mobileDrawer.classList.add('open');
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      menuIcon.classList.add('hidden');
      closeIcon.classList.remove('hidden');
    }
  });

  // Close mobile drawer on link click
  const drawerLinks = mobileDrawer.querySelectorAll('a');
  drawerLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileDrawer.classList.remove('open');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      menuIcon.classList.remove('hidden');
      closeIcon.classList.add('hidden');
    });
  });
}

// 5. Accordion System for FAQ
function initFAQAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    const body = item.querySelector('.faq-body');

    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all active items
      faqItems.forEach(otherItem => {
        otherItem.classList.remove('active');
        otherItem.querySelector('.faq-header').setAttribute('aria-expanded', 'false');
        otherItem.querySelector('.faq-body').style.maxHeight = null;
      });

      // Toggle clicked item
      if (!isActive) {
        item.classList.add('active');
        header.setAttribute('aria-expanded', 'true');
        body.style.maxHeight = body.scrollHeight + "px";
      }
    });
  });
}

// 6. Intersection Observer for Scroll Reveal Animations
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');

  const observerOptions = {
    root: null,
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  reveals.forEach(el => observer.observe(el));
}

// 7. Sticky Header Shadow on Scroll
function initHeaderScrollEffect() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// Initialize scripts when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  handleAuthRouting();
  initMobileMenu();
  initFAQAccordion();
  initScrollReveal();
  initHeaderScrollEffect();
});
