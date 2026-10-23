<script setup lang="ts">
import { PlaySquare } from 'lucide-vue-next';
</script>

<template>
  <!-- 
    Use a wrapper with flex-col and min-h-screen to push the footer to the bottom.
    The parent layout must have a flex column with min-height 100vh.
    Inside this component we make the footer stick to the bottom using mt-auto.
  -->
  <footer class="mt-auto bg-white text-black shadow-2xl overflow-hidden dark:text-white dark:shadow-white dark:bg-black">
    <!-- Main Footer -->
    <div class="px-10 py-8">
      <div class="flex flex-col md:flex-row justify-between gap-8">
        <!-- Brand -->
        <div class="flex flex-col">
          <div class="flex items-center gap-3">
            <img
              src="../assets/markverse.png"
              width="60"
              height="50"
              alt="MARKVERSE Logo"
            >
            <div class="font-extrabold text-2xl">
              <p>
                MARK
                <span class="text-blue-600">VERSE</span>
              </p>
            </div>
          </div>
          <p class="text-black dark:text-white text-sm mt-4 max-w-sm">
            Discover, explore and enjoy your favorite movies,
            series and entertainment in one place.
          </p>
        </div>

        <!-- Information -->
        <div>
          <h3 class="font-bold text-lg mb-3">Information</h3>
          <div class="flex flex-col gap-2 text-sm text-black dark:text-white">
            <a href="#" class="hover:text-blue-500 transition">About Us</a>
            <a href="#" class="hover:text-blue-500 transition">Contact</a>
            <a href="#" class="hover:text-blue-500 transition">Privacy Policy</a>
            <a href="#" class="hover:text-blue-500 transition">Terms & Conditions</a>
          </div>
        </div>

        <!-- Social -->
        <div>
          <h3 class="font-bold text-lg mb-3">Follow Us</h3>
          <div class="flex gap-3">
            <a
              href="#"
              class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-blue-600 transition"
              aria-label="Facebook"
            >
              <span class="font-bold">f</span>
            </a>
            <a
              href="#"
              class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-blue-600 transition"
              aria-label="Twitter"
            >
              <span class="font-bold">𝕏</span>
            </a>
            <a
              href="#"
              class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-blue-600 transition"
              aria-label="Instagram"
            >
              <span class="font-bold">◎</span>
            </a>
            <a
              href="#"
              class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-blue-600 transition"
              aria-label="YouTube"
            >
              <span class="font-bold"><PlaySquare class="h-4 w-4" /></span>
            </a>
          </div>
        </div>
      </div>

      <!-- Divider & Copyright -->
      <div class="border-t border-gray-400 mt-8 pt-5">
        <div class="flex flex-col md:flex-row justify-between items-center gap-3 text-sm dark:text-white text-black">
          <p>
            © 2026
            <span class="font-bold dark:text-white text-black">MARK</span>
            <span class="font-bold text-blue-500">VERSE</span>.
            All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<!-- 
  IMPORTANT: The parent layout must be a flex column with at least min-h-screen,
  and the main content should have flex-grow so the footer sits at the bottom.

  Example parent layout (in App.vue or a layout component):
  <div class="flex flex-col min-h-screen">
    <Header />
    <main class="flex-grow"> ... page content ... </main>
    <Footer />   <-- this footer component will be pushed to bottom via mt-auto
  </div>
-->