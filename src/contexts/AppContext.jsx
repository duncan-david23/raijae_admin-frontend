import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';

export const AppContext = createContext();

// Export a straight function to use the context
export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState('')
  const [activeSettingsMenu, setActiveSettingsMenu] = useState('api-settings')
  const [messageId, setMessageId] = useState()
   const [displayDonateModal, setDisplayDonateModal] = useState(false);
   const [donationAmount, setDonationAmount] = useState(0);
   const [messageQ, setMessageQ] = useState()
   const [collapsedSidebar, setCollapsedSidebar] = useState(false);
   const [showAddProduct, setShowAddProduct] = useState(false);
   const [showAddPost, setShowAddPost] = useState(false);
   const [showEditProduct, setShowEditProduct] = useState(false);
   const [displayConfirmModal, setDisplayConfirmModal] = useState(false);
   const [confirmStatus, setConfirmStatus] = useState(false);
   const [selectedProduct, setSelectedProduct] = useState(null);
   const [selectedPost, setSelectedPost] = useState(null);
   const [allProducts, setAllProducts] = useState([]);
   const [currency, setCurrency] = useState('USD');
   const [profileName, setProfileName] = useState()
   const [profileEmail, setProfileEmail] = useState()
   const [profileImageUrl, setProfileImageUrl] = useState()
   const [profilePhoneNumber, setProfilePhoneNumber] = useState()




  //  ✅ Fetch account settings when page loads
  // useEffect(() => {
  //   const fetchAccountSettings = async () => {
  //     try {
  //       const {
  //         data: { session },
  //       } = await supabase.auth.getSession();

  //       if (!session) {
  //         console.error("❌ No active session.");
  //         return;
  //       }

  //       const accessToken = session.access_token;

  //       const response = await axios.get(
  //         "http://192.168.100.126:3001/api/settings/account-settings",
  //         {
  //           headers: { Authorization: `Bearer ${accessToken}` },
  //         }
  //       );

  //       if (response.data.data) {

  //         setProfileEmail(response.data.data.email);
  //         setProfileName(response.data.data.display_name);
  //         setProfileImageUrl(response.data.data.profile_image_url)

  //       }
  //     } catch (error) {
  //       console.error("❌ Error fetching account settings:", error);
  //     }
  //   };

  //   fetchAccountSettings();
  // }, []);




  const dataValues = {
    loading,
    setLoading,
    activeMenu, 
    setActiveMenu,
    messageId, 
    setMessageId,
    activeSettingsMenu, 
    setActiveSettingsMenu,
    donationAmount, setDonationAmount,
    displayDonateModal, setDisplayDonateModal,
    messageQ, setMessageQ,
    collapsedSidebar, 
    setCollapsedSidebar,
    showAddProduct, setShowAddProduct,
    confirmStatus, setConfirmStatus,
    displayConfirmModal, setDisplayConfirmModal,
    showEditProduct, setShowEditProduct,
    selectedProduct, setSelectedProduct,
    allProducts, setAllProducts,
    showAddPost, setShowAddPost,
    selectedPost, setSelectedPost,
    currency, setCurrency,
    profileEmail, setProfileEmail,
    profileName, setProfileName,
    profileImageUrl, setProfileImageUrl
  };

  return (
    <AppContext.Provider value={ dataValues }>
      {children}
    </AppContext.Provider>
  );
};
