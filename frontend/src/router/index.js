import { createRouter, createWebHistory } from "vue-router";

// Client

import Home from "../components/Home.vue";
import Movies from "../components/Movies.vue";
import Series from "../components/Series.vue";
import Browser from "../components/Browser.vue";
import Watch from "../components/Watch.vue";
import SearchPage from "../components/Search.vue";
import ChannelDetail from "../components/ChannelDetail.vue";
import Channel from "../components/Channel.vue";

// User

import Downloads from "../components/user/Downloads.vue";
import UserProfile from "../components/user/UserProfile.vue";

// Admin panel

import AdminDashboard from '../components/admin/AdminDashboard.vue'
import AdminUploads from '../components/admin/AdminUploads.vue'
import AdminUsers from '../components/admin/AdminUsers.vue'
import AdminProfile from '../components/admin/AdminProfile.vue'
import AdminComments from "../components/admin/AdminComments.vue";
import AdminNotifications from "../components/admin/AdminNotifications.vue";
import AdminChannelManagement from "../components/admin/AdminChannelManagement.vue";

// Authication

import Authication from "../components/Authication.vue";




const routes = [
  {
  path: '/login',
  component: Authication
},

{
  path: '/',
  component: Home
},
{
  path:'/movies',
  component:Movies
},
{
  path:'/series',
  component:Series
},
{
  path:'/browser',
  component:Browser
},
{
  path:'/watch/:id',
  component:Watch
},
{
  path:'/user/profile',
  component:UserProfile
},
{ 
  path: '/search',
   component: SearchPage 
  },
  {
    path:'/user/downloads',
    component:Downloads
 },
 {
   path: '/channels',
    component:Channel
  },
{ 
  path: '/channels/:id',
   component:ChannelDetail 

},

 // Admin
  { path: '/admin', component: AdminDashboard },
  { path: '/admin/upload', component: AdminUploads },
  { path: '/admin/users', component: AdminUsers },
  { path: '/admin/profile', component: AdminProfile },
  { path: '/admin/comments', component: AdminComments },
  { path: '/admin/notifications', component: AdminNotifications },
  { path: '/admin/channel-management', component: AdminChannelManagement }


];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;