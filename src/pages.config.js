/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminAmbassadors from './pages/AdminAmbassadors';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminBroadcast from './pages/AdminBroadcast';
import AdminContent from './pages/AdminContent';
import AdminDashboard from './pages/AdminDashboard';
import AdminLaunchChecklist from './pages/AdminLaunchChecklist';
import AdminManual from './pages/AdminManual';
import AdminModeration from './pages/AdminModeration';
import AdminSettings from './pages/AdminSettings';
import AdminSubscriptions from './pages/AdminSubscriptions';
import AdminUsers from './pages/AdminUsers';
import AdminVIPEvents from './pages/AdminVIPEvents';
import AmbassadorApply from './pages/AmbassadorApply';
import AmbassadorPortal from './pages/AmbassadorPortal';
import Analytics from './pages/Analytics';
import AppStoreCompliance from './pages/AppStoreCompliance';
import AuthFlowTest from './pages/AuthFlowTest';
import BackgroundCheckRequest from './pages/BackgroundCheckRequest';
import BlockedUsers from './pages/BlockedUsers';
import Chat from './pages/Chat';
import Communities from './pages/Communities';
import CommunityChat from './pages/CommunityChat';
import CommunityGuidelines from './pages/CommunityGuidelines';
import CompatibilityQuiz from './pages/CompatibilityQuiz';
import CompatibilityQuizzes from './pages/CompatibilityQuizzes';
import CreateEvent from './pages/CreateEvent';
import CustomerView from './pages/CustomerView';
import DailyMatches from './pages/DailyMatches';
import DatePlanner from './pages/DatePlanner';
import DeleteAccount from './pages/DeleteAccount';
import EditProfile from './pages/EditProfile';
import Error from './pages/Error';
import EventChat from './pages/EventChat';
import EventDetails from './pages/EventDetails';
import Events from './pages/Events';
import Home from './pages/Home';
import IDVerification from './pages/IDVerification';
import InvestorReport from './pages/InvestorReport';
import Landing from './pages/Landing';
import Login from './pages/Login';
import LanguageExchangeHub from './pages/LanguageExchangeHub';
import LegalAcceptance from './pages/LegalAcceptance';
import Marketplace from './pages/Marketplace';
import Matches from './pages/Matches';
import MigrationCalculator from './pages/MigrationCalculator';
import NotFound from './pages/NotFound';
import Notifications from './pages/Notifications';
import Onboarding from './pages/Onboarding';
import PasswordReset from './pages/PasswordReset';
import PhoneVerification from './pages/PhoneVerification';
import PhotoPerformance from './pages/PhotoPerformance';
import PricingPlans from './pages/PricingPlans';
import Privacy from './pages/Privacy';
import Profile from './pages/Profile';
import ProfileOptimization from './pages/ProfileOptimization';
import ReferralProgram from './pages/ReferralProgram';
import Report from './pages/Report';
import SafetyCheckMonitor from './pages/SafetyCheckMonitor';
import SafetyCheckSetup from './pages/SafetyCheckSetup';
import Settings from './pages/Settings';
import Shop from './pages/Shop';
import SpeedDatingLobby from './pages/SpeedDatingLobby';
import Stories from './pages/Stories';
import SubmitStory from './pages/SubmitStory';
import SuccessStories from './pages/SuccessStories';
import SuccessStoryContest from './pages/SuccessStoryContest';
import Support from './pages/Support';
import SupportChat from './pages/SupportChat';
import Terms from './pages/Terms';
import Unsubscribe from './pages/Unsubscribe';
import VIPEventsHub from './pages/VIPEventsHub';
import VendorManagement from './pages/VendorManagement';
import VerifyPhoto from './pages/VerifyPhoto';
import VirtualGifts from './pages/VirtualGifts';
import Waitlist from './pages/Waitlist';
import WhoLikesYou from './pages/WhoLikesYou';
import MigrationDocument from './pages/MigrationDocument';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAmbassadors": AdminAmbassadors,
    "AdminAnalytics": AdminAnalytics,
    "AdminBroadcast": AdminBroadcast,
    "AdminContent": AdminContent,
    "AdminDashboard": AdminDashboard,
    "AdminLaunchChecklist": AdminLaunchChecklist,
    "AdminManual": AdminManual,
    "AdminModeration": AdminModeration,
    "AdminSettings": AdminSettings,
    "AdminSubscriptions": AdminSubscriptions,
    "AdminUsers": AdminUsers,
    "AdminVIPEvents": AdminVIPEvents,
    "AmbassadorApply": AmbassadorApply,
    "AmbassadorPortal": AmbassadorPortal,
    "Analytics": Analytics,
    "AppStoreCompliance": AppStoreCompliance,
    "AuthFlowTest": AuthFlowTest,
    "BackgroundCheckRequest": BackgroundCheckRequest,
    "BlockedUsers": BlockedUsers,
    "Chat": Chat,
    "Communities": Communities,
    "CommunityChat": CommunityChat,
    "CommunityGuidelines": CommunityGuidelines,
    "CompatibilityQuiz": CompatibilityQuiz,
    "CompatibilityQuizzes": CompatibilityQuizzes,
    "CreateEvent": CreateEvent,
    "CustomerView": CustomerView,
    "DailyMatches": DailyMatches,
    "DatePlanner": DatePlanner,
    "DeleteAccount": DeleteAccount,
    "EditProfile": EditProfile,
    "Error": Error,
    "EventChat": EventChat,
    "EventDetails": EventDetails,
    "Events": Events,
    "Home": Home,
    "IDVerification": IDVerification,
    "InvestorReport": InvestorReport,
    "Landing": Landing,
    "Login": Login,
    "LanguageExchangeHub": LanguageExchangeHub,
    "LegalAcceptance": LegalAcceptance,
    "Marketplace": Marketplace,
    "Matches": Matches,
    "MigrationCalculator": MigrationCalculator,
    "NotFound": NotFound,
    "Notifications": Notifications,
    "Onboarding": Onboarding,
    "PasswordReset": PasswordReset,
    "PhoneVerification": PhoneVerification,
    "PhotoPerformance": PhotoPerformance,
    "PricingPlans": PricingPlans,
    "Privacy": Privacy,
    "Profile": Profile,
    "ProfileOptimization": ProfileOptimization,
    "ReferralProgram": ReferralProgram,
    "Report": Report,
    "SafetyCheckMonitor": SafetyCheckMonitor,
    "SafetyCheckSetup": SafetyCheckSetup,
    "Settings": Settings,
    "Shop": Shop,
    "SpeedDatingLobby": SpeedDatingLobby,
    "Stories": Stories,
    "SubmitStory": SubmitStory,
    "SuccessStories": SuccessStories,
    "SuccessStoryContest": SuccessStoryContest,
    "Support": Support,
    "SupportChat": SupportChat,
    "Terms": Terms,
    "Unsubscribe": Unsubscribe,
    "VIPEventsHub": VIPEventsHub,
    "VendorManagement": VendorManagement,
    "VerifyPhoto": VerifyPhoto,
    "VirtualGifts": VirtualGifts,
    "Waitlist": Waitlist,
    "WhoLikesYou": WhoLikesYou,
    "MigrationDocument": MigrationDocument,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};