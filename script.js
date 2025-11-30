// ================================
// 1. មុខងារ Add to Cart
// ================================

// យក element ដែលបង្ហាញចំនួនក្នុង Cart (លេខលើកន្ត្រក)
const cartCountElement = document.querySelector(".cart-count");

// យកប៊ូតុងទាំងអស់ដែលមាន class="add-to-cart"
const addToCartButtons = document.querySelectorAll(".add-to-cart");

// កំណត់ចំនួនចាប់ផ្តើម = 0
let count = 0;

// Loop លើប៊ូតុង Add to Cart ទាំងអស់
addToCartButtons.forEach((button) => {
  // ភ្ជាប់ event click ទៅប៊ូតុង
  button.addEventListener("click", () => {
    // រៀងរាល់ការចុច → បូក count
    count++;

    // បង្ហាញលេខថ្មីទៅលើ cart icon
    cartCountElement.textContent = count;

    // --------------------------
    // បង្ហាញ​ពណ៌​ប៊ូតុង និងសារ​ថា "Added!" មួយភ្លែត
    // --------------------------

    const originalText = button.textContent; // កត់សំគាល់អត្ថបទដើម (Add to Cart)
    button.textContent = "Added!"; // ប្ដូរទៅ Added!
    button.style.backgroundColor = "#27ae60"; // ប្តូរពណ៌បៃតងបន្តិច

    // ក្រោយ 1 វិនាទី ត្រឡប់ទៅដើម
    setTimeout(() => {
      button.textContent = originalText; // ត្រឡប់អត្ថបទ
      button.style.backgroundColor = ""; // បោះចោល style ពណ៌បៃតង
    }, 1000);
  });
});

// ================================
// 2. មុខងារ Scroll Animation (អោយរូប fade-in ពេលអូស Scroll)
// ================================

// querySelectorAll(".fade-in") → យក element ដែលចង់អោយ fade-in ពេល scroll
const faders = document.querySelectorAll(".fade-in");

// Setting របៀបដែល Observer ត្រូវដំណើរការ
const appearOptions = {
  threshold: 0.2, // 20% នៃ element ចូលក្នុងតំបន់ → ចាប់ផ្តើម animation
  rootMargin: "0px 0px -50px 0px", // បញ្ចុះ margin ដើម្បីអោយមើលឃើញលឿន
};

// បង្កើត IntersectionObserver ដែលតាមមើល element ពេលវាចូលអេក្រង់
const appearOnScroll = new IntersectionObserver(function (
  entries, // entries = element ដែលកំពុងត្រូវតាមមើល
  appearOnScroll // Observer ខ្លួនឯង
) {
  entries.forEach((entry) => {
    // entry.isIntersecting = true បើវាត្រូវបាន Scroll មើលឃើញ
    if (!entry.isIntersecting) {
      return; // បើមិនទាន់ឃើញ → មិនធ្វើអីទេ
    } else {
      // បើឃើញហើយ → បន្ថែម class "visible" ដើម្បីចាប់ Animation
      entry.target.classList.add("visible");

      // មិនត្រូវតាមមើលវាទៀតទេ (avoid repeat animation)
      appearOnScroll.unobserve(entry.target);
    }
  });
}, appearOptions);

// តាមមើល(fade-in) element ទាំងអស់
faders.forEach((fader) => {
  appearOnScroll.observe(fader);
});
