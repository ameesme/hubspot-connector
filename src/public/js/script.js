$(document).ready(function () {
  // ===== STEP ELEMENTS =====
  const step1El = document.getElementById("step1");
  const step2El = document.getElementById("step2");

  const toStep2Btn = document.getElementById("toStep2Btn");
  const backToStep1Btn = document.getElementById("backToStep1Btn");

  // ===== FREQUENCY & AMOUNT ELEMENTS =====
  const oneTimeRadio = document.getElementById("oneTime");
  const monthlyRadio = document.getElementById("monthly");
  const oneTimeAmounts = document.getElementById("oneTimeAmounts");
  const monthlyAmounts = document.getElementById("monthlyAmounts");

  const oneTimeOtherRadio = document.getElementById("oneTimeOther");
  const oneTimeOtherInput = document.getElementById("oneTimeOtherInput");
  const oneTimeCustomAmount = document.getElementById("oneTimeCustomAmount");

  const monthlyOtherRadio = document.getElementById("monthlyOther");
  const monthlyOtherInput = document.getElementById("monthlyOtherInput");
  const monthlyCustomAmount = document.getElementById("monthlyCustomAmount");

  // ===== PERSONAL DETAILS ELEMENTS =====
  const email = document.getElementById("email");
  const firstName = document.getElementById("firstName");
  const companyCheckbox = document.getElementById("companyCheckbox");
  const companyURL = document.getElementById("companyURL");
  const companyFields = document.getElementById("companyFields");

  // ===== HELPER: Email Validation Regex =====
  function isValidEmail(str) {
    // Basic pattern; you can refine it if needed
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }

  // ===== RESTRICT Invalid Characters in Custom Amounts =====
  function restrictInvalidChars(event) {
    const invalidKeys = [".", ",", "e", "E"];
    if (invalidKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  // Remove invalid characters on paste or direct input
  function removeInvalidCharsOnInput(event) {
    // Replace any occurrence of '.', ',', 'e', 'E'
    event.target.value = event.target.value.replace(/[.,eE]/g, "");
  }

  // Attach these listeners to both custom amount fields
  [oneTimeCustomAmount, monthlyCustomAmount].forEach((inputEl) => {
    // Prevent typing invalid keys
    inputEl.addEventListener("keydown", restrictInvalidChars);
    // Remove invalid characters on paste/input
    inputEl.addEventListener("input", removeInvalidCharsOnInput);
  });

  // ===== TOGGLE DONATION AMOUNTS (Step 1) =====
  function toggleDonationAmounts() {
    if (oneTimeRadio.checked) {
      oneTimeAmounts.style.display = "block";
      monthlyAmounts.style.display = "none";
      monthlyOtherInput.style.display = "none";
      monthlyOtherRadio.checked = false;

      // Default check for one-time if none is selected
      if (!document.querySelector('input[name="donationAmount"]:checked')) {
        document.getElementById("oneTime25").checked = true;
      }
    } else {
      oneTimeAmounts.style.display = "none";
      monthlyAmounts.style.display = "block";
      oneTimeOtherInput.style.display = "none";
      oneTimeOtherRadio.checked = false;

      // Default check for monthly if none is selected
      if (!document.querySelector('input[name="donationAmount"]:checked')) {
        document.getElementById("monthly5").checked = true;
      }
    }
  }

  // Switch between frequencies
  oneTimeRadio.addEventListener("change", toggleDonationAmounts);
  monthlyRadio.addEventListener("change", toggleDonationAmounts);

  // Show/hide â€œOtherâ€ input for one-time
  oneTimeOtherRadio.addEventListener("change", () => {
    if (oneTimeOtherRadio.checked) {
      oneTimeOtherInput.style.display = "block";
    }
  });
  ["oneTime25", "oneTime50", "oneTime100"].forEach((id) => {
    try {
      document.getElementById(id).addEventListener("change", () => {
        oneTimeOtherInput.style.display = "none";
      });
    } catch (e) {
      console.log("Failed to register event listener");
      console.log(e);
    }
  });

  // Show/hide â€œOtherâ€ input for monthly
  monthlyOtherRadio.addEventListener("change", () => {
    if (monthlyOtherRadio.checked) {
      monthlyOtherInput.style.display = "block";
    }
  });
  ["monthly5", "monthly10", "monthly25"].forEach((id) => {
    document.getElementById(id).addEventListener("change", () => {
      monthlyOtherInput.style.display = "none";
    });
  });

  // ===== STEP 1 -> STEP 2 =====
  toStep2Btn.addEventListener("click", () => {
    // Check if the user selected â€œOtherâ€ and validate range
    const isOneTime = oneTimeRadio.checked;
    if (isOneTime && oneTimeOtherRadio.checked) {
      const val = parseInt(oneTimeCustomAmount.value, 10);
      if (isNaN(val) || val < 1 || val > 9999) {
        alert("Please enter a valid one-time amount between 1 and 9999.");
        return;
      }
    }
    if (!isOneTime && monthlyOtherRadio.checked) {
      const val = parseInt(monthlyCustomAmount.value, 10);
      if (isNaN(val) || val < 1 || val > 9999) {
        alert("Please enter a valid monthly amount between 1 and 9999.");
        return;
      }
    }

    // If all checks pass, go to Step 2
    step1El.style.display = "none";
    step2El.style.display = "block";
  });

  // ===== BACK BUTTONS =====
  backToStep1Btn.addEventListener("click", () => {
    step2El.style.display = "none";
    step1El.style.display = "block";
  });

  // ===== DONATE AS A COMPANY LOGIC =====
  companyCheckbox.addEventListener("change", () => {
    companyFields.style.display = companyCheckbox.checked ? "block" : "none";
  });

  // ===== FINAL SUBMIT HANDLER =====
  const donationForm = document.getElementById("donationForm");
  donationForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Simple check if required fields in Step 2 are filled:
    const emailVal = email.value.trim();
    const firstNameVal = firstName.value.trim();

    if (!isValidEmail(emailVal)) {
      alert("Please enter a valid email address.");
      return;
    }
    if (firstNameVal === "") {
      alert("Please fill out the First Name field.");
      return;
    }

    // If donating as a company, company URL must not be empty
    if (companyCheckbox.checked) {
      const companyURLVal = companyURL.value.trim();
      if (companyURLVal === "") {
        alert("Please fill out the Company URL if donating as a company.");
        return;
      }
    }

    // Payment Method & Terms check
    const agreeCheck = document.getElementById("agreeCheck");
    if (!agreeCheck.checked) {
      alert("You must agree to the privacy policy and terms.");
      return;
    }

    const formData = new FormData(donationForm);
    const jsonData = Object.fromEntries(formData);
    const urlParams = new URLSearchParams(window.location.search);
    const campaignName = urlParams.get("utm_campaign");

    fetch("https://payments.sheltersuit.com/create-donation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...jsonData,
        campaignName,
        locale: window.navigator
          ? window.navigator.language || window.navigator.userLanguage
          : undefined,
      }),
    }).then(async (response) => {
      if (response.ok) {
        const parsedResponse = await response.json();
        try {
          window.parent.postMessage(
            { message: "redirect", redirect: parsedResponse.redirectUrl },
            "*"
          );
        } catch (e) {
          console.log("Failed to send message to parent window", e);
          window.open(parsedResponse.redirectUrl, "_blank");
        }
      } else {
        alert("An error occurred. Please try again later.");
      }
    });
  });

  // Initialize display on page load
  toggleDonationAmounts();
});
