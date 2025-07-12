document.addEventListener("DOMContentLoaded", () => {
  const popupAlertContainer = document.querySelector(".cart__pop_up");
  const popupAlertText = document.querySelector("#popup-cart-text");
  const popupAlertCloseBtn = document.querySelector(".cpu__close__btn");

  if (document.querySelectorAll("[data-atc-btn]")) {
    document.querySelectorAll("[data-atc-btn]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const variantId = btn.dataset.variant;

        const proceedToAddToCart = async () => {
          const formData = {
            items: [
              {
                id: variantId,
                quantity: 1,
              },
            ],
          };

          const addRes = await fetch(
            window.Shopify.routes.root + "cart/add.js",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(formData),
            }
          );

          const addResult = await addRes.json();

          new theme.CartDrawer();
          const cartDrawerTrigger = document.querySelector(
            ".js-drawer-open-cart"
          );
          if (cartDrawerTrigger) cartDrawerTrigger.click();
          updateCartBubble();
        };

        try {
          const cartRes = await fetch("/cart.js");
          const cart = await cartRes.json();

          // ✅ Allow all if cart is empty
          if (cart.items.length === 0) {
            console.log("Cart is empty — adding freely.");
            await proceedToAddToCart();
            return;
          }

          const [freezeData, deepFreezeData] = await Promise.all([
            fetch("/collections/kuhltheke/products.json").then((r) => r.json()),
            fetch("/collections/tiefkuhltheke/products.json").then((r) =>
              r.json()
            ),
          ]);

          const freezeProductIds = freezeData.products.map((p) => p.id);
          const deepFreezeProductIds = deepFreezeData.products.map((p) => p.id);

          const cartCategories = new Set();
          cart.items.forEach((item) => {
            if (freezeProductIds.includes(item.product_id)) {
              cartCategories.add("freeze");
            } else if (deepFreezeProductIds.includes(item.product_id)) {
              cartCategories.add("deepFreeze");
            } else {
              cartCategories.add("dry");
            }
          });

          const findProductIdByVariantId = (variantId, products) => {
            for (const product of products) {
              if (product.variants.some((v) => v.id.toString() === variantId)) {
                return product.id;
              }
            }
            return null;
          };

          let productId = findProductIdByVariantId(
            variantId,
            freezeData.products
          );
          let variantCategory = null;

          if (productId) {
            variantCategory = "freeze";
          } else {
            productId = findProductIdByVariantId(
              variantId,
              deepFreezeData.products
            );
            if (productId) {
              variantCategory = "deepFreeze";
            } else {
              variantCategory = "dry";
            }
          }

          console.log("Target variant:", variantId, "=>", variantCategory);
          console.log("Cart has:", [...cartCategories]);

          // 🧠 Category-based restrictions
          if (cartCategories.has("freeze") && variantCategory !== "freeze") {
            popupAlertContainer.classList.add("open");
            popupAlertText.textContent =
              "This item cannot be added to the order because it is frozen, and there are dry or deep-frozen items already in the cart. Frozen items cannot be mixed with dry or deep-frozen items.";
            return;
          }

          if (
            cartCategories.has("deepFreeze") &&
            variantCategory !== "deepFreeze"
          ) {
            popupAlertContainer.classList.add("open");
            popupAlertText.textContent =
              "This item cannot be added to the order because it is deep-frozen, and there are dry or frozen items already in the cart. Deep-frozen items cannot be mixed with dry or frozen items.";
            return;
          }

          if (cartCategories.has("dry") && variantCategory !== "dry") {
            popupAlertContainer.classList.add("open");
            popupAlertText.textContent =
              "This item cannot be added to the order because it is dry, and there are frozen or deep-frozen items already in the cart. Dry items cannot be mixed with frozen or deep-frozen items.";
            return;
          }

          // ✅ If all good
          await proceedToAddToCart();
        } catch (error) {
          console.error("Error:", error);
        }
      });
    });

    // ✅ Close alert popup on click
    if (popupAlertCloseBtn) {
      popupAlertCloseBtn.addEventListener("click", () => {
        popupAlertContainer.classList.remove("open");
      });
    }
  }
});

// btn.addEventListener("click", async (e) => {
//   e.preventDefault();
//   const variantId = btn.dataset.variant;

//   try {
//     // Get current cart
//     const cartRes = await fetch("/cart.js");
//       const cart = await cartRes.json();
//       if (cart.items.length === 0) {
//         console.log("Cart is empty — allowing all categories.");
//         proceedToAddToCart(); // custom function for add-to-cart and UI updates
//         return;
//       }

//     // Fetch collection products in parallel
//     const [freezeData, deepFreezeData] = await Promise.all([
//       fetch("/collections/kuhltheke/products.json").then((r) => r.json()),
//       fetch("/collections/tiefkuhltheke/products.json").then((r) =>
//         r.json()
//       ),
//     ]);

//     const freezeProductIds = freezeData.products.map((p) => p.id);
//     const deepFreezeProductIds = deepFreezeData.products.map((p) => p.id);

//     // Build set of product_ids in cart by category
//     const cartCategories = new Set();
//     cart.items.forEach((item) => {
//       if (freezeProductIds.includes(item.product_id)) {
//         cartCategories.add("freeze");
//       } else if (deepFreezeProductIds.includes(item.product_id)) {
//         cartCategories.add("deepFreeze");
//       } else {
//         cartCategories.add("dry");
//       }
//     });

//     // Find category of the product user wants to add (variantId)
//     // We need to get product id of this variant.
//     // Unfortunately, we have variant id, but collections only return product id.
//     // So we need to find product id from freeze/deep freeze products by checking variant ids

//     // Helper to find product id by variant id from collection products
//     function findProductIdByVariantId(variantId, products) {
//       for (const product of products) {
//         if (product.variants.some((v) => v.id.toString() === variantId)) {
//           return product.id;
//         }
//       }
//       return null;
//     }

//     let productId = findProductIdByVariantId(
//       variantId,
//       freezeData.products
//     );
//     let variantCategory = null;
//     if (productId) {
//       variantCategory = "freeze";
//     } else {
//       productId = findProductIdByVariantId(
//         variantId,
//         deepFreezeData.products
//       );
//       if (productId) {
//         variantCategory = "deepFreeze";
//       } else {
//         variantCategory = "dry"; // not found in freeze or deep freeze
//       }
//     }

//     console.log(
//       "Attempting to add variant:",
//       variantId,
//       "category:",
//       variantCategory
//     );
//     console.log("Cart currently has categories:", [...cartCategories]);

//     // Business rules:
//     // If cart has freeze, disallow deepFreeze or dry
//     if (cartCategories.has("freeze") && variantCategory !== "freeze") {
//       alert(
//         "You cannot add Deep Freeze or Dry products when Freeze products are in the cart."
//       );
//       return; // block adding
//     }

//     // If cart has deepFreeze, disallow freeze or dry
//     if (
//       cartCategories.has("deepFreeze") &&
//       variantCategory !== "deepFreeze"
//     ) {
//       alert(
//         "You cannot add Freeze or Dry products when Deep Freeze products are in the cart."
//       );
//       return; // block adding
//     }

//     // If cart has dry, disallow freeze or deepFreeze
//     if (cartCategories.has("dry") && variantCategory !== "dry") {
//       alert(
//         "You cannot add Freeze or Deep Freeze products when Dry products are in the cart."
//       );
//       return; // block adding
//     }

//     // If no blocking condition met, proceed to add item to cart

//     const formData = {
//       items: [
//         {
//           id: variantId,
//           quantity: 1,
//         },
//       ],
//     };

//     const addRes = await fetch(
//       window.Shopify.routes.root + "cart/add.js",
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(formData),
//       }
//     );

//     const addResult = await addRes.json();

//     // Update cart drawer etc
//     new theme.CartDrawer();
//     const cartDrawerTrigger = document.querySelector(
//       ".js-drawer-open-cart"
//     );
//     if (cartDrawerTrigger) cartDrawerTrigger.click();
//     updateCartBubble();
//   } catch (error) {
//     console.error("Error processing cart add:", error);
//     alert("Sorry, there was a problem adding the product to the cart.");
//   }
// });
// btn.addEventListener("click", (e) => {
//   e.preventDefault();
//   const { variant } = btn.dataset;

//   const formData = {
//     items: [
//       {
//         id: variant,
//         quantity: 1,
//       },
//     ],
//   };

//   fetch(window.Shopify.routes.root + "cart/add.js", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(formData),
//   })
//     .then((response) => response.json())
//     .then(() => {
//       // ✅ Get updated cart
//       return fetch("/cart.js");
//     })
//     .then((res) => res.json())
//     .then((cart) => {
//       // Run both collection fetches in parallel
//       return Promise.all([
//         fetch("/collections/kuhltheke/products.json").then((res) =>
//           res.json()
//         ),
//         fetch("/collections/tiefkuhltheke/products.json").then((res) =>
//           res.json()
//         ),
//       ]).then(([freezeData, deepFreezeData]) => {
//         const freezeProductIds = freezeData.products.map((p) => p.id);
//         const deepFreezeProductIds = deepFreezeData.products.map(
//           (p) => p.id
//         );

//         //I want you to build the logic for if freeze item is already in the cart I can't add to cart other categories product deepFreezeProductIds and others, if Other(Which is dry) item is already in the cart I can't add to cart other categories product FreezeProductIds and others, deepFreezeProductIds
//         console.log("Actual Target Id Form Submission's", variant);
//         cart.items.forEach((item) => {
//           console.log("Cart product ID:", item.product_id);

//           if (freezeProductIds.includes(item.product_id)) {
//             console.log("❄️ Freeze Product Already:", item.title);
//           }

//           if (deepFreezeProductIds.includes(item.product_id)) {
//             console.log("🧊 Deep Freeze Product Already:", item.title);
//           }
//         });
//       });
//     })

//     .catch((error) => {
//       console.error("Error:", error);
//     })
//     .finally(() => {
//       new theme.CartDrawer();
//       const cartDrawerTrigger = document.querySelector(
//         ".js-drawer-open-cart"
//       );
//       if (cartDrawerTrigger) cartDrawerTrigger.click();
//       updateCartBubble();
//     });
// });
