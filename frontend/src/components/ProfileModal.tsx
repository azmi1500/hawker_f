// src/components/ProfileModal.tsx
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { User } from '../types';

// src/components/ProfileModal.tsx
interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  isMobile: boolean;
  currentTheme: any;
  t: any;
  profileMode: string;
  profileTab: string;
  setProfileTab: (tab: string) => void;
  theme: string;
  language: string;
  handleThemeChange: (theme: string) => void;
  handleLanguageChange: (lang: string) => void;
  handleLogout: () => void;
  user: { id: number | string; username: string; role: string } | null;  // Accept both
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  visible,
  onClose,
  isMobile,
  currentTheme,
  t,
  profileMode,
  profileTab,
  setProfileTab,
  theme,
  language,
  handleThemeChange,
  handleLanguageChange,
  handleLogout,
  user,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.profileModal, isMobile && styles.profileModalMobile, { backgroundColor: currentTheme.card }]}>
          <View style={[styles.profileModalHeader, { backgroundColor: currentTheme.primary }]}>
            <Text style={styles.profileModalTitle}>
              {profileMode === 'full' ? t.profile : 'Logout'}
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {profileMode === 'full' ? (
            /* Full modal with Theme & Language tabs */
            <>
              <View style={[styles.profileTabs, { borderBottomColor: currentTheme.border }]}>
                <TouchableOpacity
                  style={[styles.profileTab, profileTab === 'theme' && styles.profileTabActive, profileTab === 'theme' && { borderBottomColor: currentTheme.primary }]}
                  onPress={() => setProfileTab('theme')}
                >
                  <Text style={[styles.profileTabText, { color: currentTheme.textSecondary }, profileTab === 'theme' && { color: currentTheme.primary }]}>
                    🎨 {t.selectTheme}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.profileTab, profileTab === 'language' && styles.profileTabActive, profileTab === 'language' && { borderBottomColor: currentTheme.primary }]}
                  onPress={() => setProfileTab('language')}
                >
                  <Text style={[styles.profileTabText, { color: currentTheme.textSecondary }, profileTab === 'language' && { color: currentTheme.primary }]}>
                    🌐 {t.selectLanguage}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.profileContent}>
                {profileTab === 'theme' ? (
                  /* Theme options */
                  <>
                    <TouchableOpacity
                      style={[styles.themeOption, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }, theme === 'light' && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}
                      onPress={() => handleThemeChange('light')}
                    >
                      <View style={[styles.themeColorPreview, { backgroundColor: '#ffffff', borderWidth: 1, borderColor: currentTheme.border }]} />
                      <Text style={[styles.themeOptionText, { color: currentTheme.text }, theme === 'light' && { color: '#ffffff' }]}>{t.lightTheme}</Text>
                      {theme === 'light' && <Text style={styles.themeCheck}>✓</Text>}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.themeOption, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }, theme === 'night' && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}
                      onPress={() => handleThemeChange('night')}
                    >
                      <View style={[styles.themeColorPreview, { backgroundColor: '#121212' }]} />
                      <Text style={[styles.themeOptionText, { color: currentTheme.text }, theme === 'night' && { color: '#ffffff' }]}>{t.nightTheme}</Text>
                      {theme === 'night' && <Text style={styles.themeCheck}>✓</Text>}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.themeOption, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }, theme === 'blue' && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}
                      onPress={() => handleThemeChange('blue')}
                    >
                      <View style={[styles.themeColorPreview, { backgroundColor: '#2196F3' }]} />
                      <Text style={[styles.themeOptionText, { color: currentTheme.text }, theme === 'blue' && { color: '#ffffff' }]}>{t.blueTheme}</Text>
                      {theme === 'blue' && <Text style={styles.themeCheck}>✓</Text>}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.themeOption, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }, theme === 'green' && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}
                      onPress={() => handleThemeChange('green')}
                    >
                      <View style={[styles.themeColorPreview, { backgroundColor: '#4CAF50' }]} />
                      <Text style={[styles.themeOptionText, { color: currentTheme.text }, theme === 'green' && { color: '#ffffff' }]}>{t.greenTheme}</Text>
                      {theme === 'green' && <Text style={styles.themeCheck}>✓</Text>}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.themeOption, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }, theme === 'purple' && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}
                      onPress={() => handleThemeChange('purple')}
                    >
                      <View style={[styles.themeColorPreview, { backgroundColor: '#9C27B0' }]} />
                      <Text style={[styles.themeOptionText, { color: currentTheme.text }, theme === 'purple' && { color: '#ffffff' }]}>{t.purpleTheme}</Text>
                      {theme === 'purple' && <Text style={styles.themeCheck}>✓</Text>}
                    </TouchableOpacity>
                  </>
                ) : (
                  /* Language options */
                  <>
                    <TouchableOpacity
                      style={[styles.languageOption, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }, language === 'en' && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}
                      onPress={() => handleLanguageChange('en')}
                    >
                      <Text style={[styles.languageOptionText, { color: currentTheme.text }, language === 'en' && { color: '#ffffff' }]}>🇬🇧 English</Text>
                      {language === 'en' && <Text style={styles.languageCheck}>✓</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.languageOption, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }, language === 'zh' && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}
                      onPress={() => handleLanguageChange('zh')}
                    >
                      <Text style={[styles.languageOptionText, { color: currentTheme.text }, language === 'zh' && { color: '#ffffff' }]}>🇨🇳 中文</Text>
                      {language === 'zh' && <Text style={styles.languageCheck}>✓</Text>}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.languageOption, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }, language === 'ms' && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}
                      onPress={() => handleLanguageChange('ms')}
                    >
                      <Text style={[styles.languageOptionText, { color: currentTheme.text }, language === 'ms' && { color: '#ffffff' }]}>🇲🇾 Bahasa Melayu</Text>
                      {language === 'ms' && <Text style={styles.languageCheck}>✓</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.languageOption, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }, language === 'ta' && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}
                      onPress={() => handleLanguageChange('ta')}
                    >
                      <Text style={[styles.languageOptionText, { color: currentTheme.text }, language === 'ta' && { color: '#ffffff' }]}>🇮🇳 தமிழ்</Text>
                      {language === 'ta' && <Text style={styles.languageCheck}>✓</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.languageOption, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }, language === 'hi' && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}
                      onPress={() => handleLanguageChange('hi')}
                    >
                      <Text style={[styles.languageOptionText, { color: currentTheme.text }, language === 'hi' && { color: '#ffffff' }]}>🇮🇳 हिन्दी</Text>
                      {language === 'hi' && <Text style={styles.languageCheck}>✓</Text>}
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </>
          ) : (
            /* Logout only mode */
            <View style={styles.profileContent}>
              <View style={styles.userInfoContainer}>
                <View style={[styles.userAvatar, { backgroundColor: currentTheme.primary }]}>
                  <Text style={styles.userAvatarText}>👤</Text>
                </View>
                <Text style={[styles.userName, { color: currentTheme.text }]}>
                  {user?.username || 'User'}
                </Text>
                <Text style={[styles.userRole, { color: currentTheme.textSecondary }]}>
                  {user?.role || 'Staff'}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.logoutButton, { backgroundColor: currentTheme.danger }]}
                onPress={handleLogout}
              >
                <Text style={styles.logoutButtonText}>🚪 Logout</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.profileCancelBtn, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}
            onPress={onClose}
          >
            <Text style={[styles.profileCancelText, { color: currentTheme.text }]}>{t.cancel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 50 : 0,
  },
  profileModal: { 
    width: '90%', 
    maxWidth: 400, 
    borderRadius: 20, 
    alignSelf: 'center',
    maxHeight: '80%',
  },
  profileModalMobile: { 
    width: '95%',
  },
  profileModalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    minHeight: Platform.OS === 'ios' ? 90 : 70,
  },
  profileModalTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#ffffff',
    includeFontPadding: false,
  },
  closeButton: { 
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: { 
    fontSize: 20, 
    color: '#ffffff', 
    fontWeight: '600',
  },
  profileTabs: { 
    flexDirection: 'row', 
    borderBottomWidth: 1,
  },
  profileTab: { 
    flex: 1, 
    paddingVertical: 14, 
    alignItems: 'center',
  },
  profileTabActive: { 
    borderBottomWidth: 2,
  },
  profileTabText: { 
    fontSize: 15,
    includeFontPadding: false,
  },
  profileContent: { 
    maxHeight: 400, 
    padding: 16,
  },
  themeOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 14, 
    borderRadius: 10, 
    marginBottom: 10, 
    borderWidth: 1,
    minHeight: 60,
  },
  themeColorPreview: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    marginRight: 14,
  },
  themeOptionText: { 
    flex: 1, 
    fontSize: 16,
    includeFontPadding: false,
  },
  themeCheck: { 
    fontSize: 20, 
    color: '#ffffff', 
    fontWeight: '600',
  },
  languageOption: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 10, 
    borderWidth: 1,
    minHeight: 60,
  },
  languageOptionText: { 
    fontSize: 16,
    includeFontPadding: false,
  },
  languageCheck: { 
    fontSize: 20, 
    color: '#ffffff', 
    fontWeight: '600',
  },
  profileCancelBtn: { 
    margin: 16, 
    marginTop: 0, 
    padding: 14, 
    borderRadius: 10, 
    borderWidth: 1, 
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  profileCancelText: { 
    fontSize: 16, 
    fontWeight: '600',
    includeFontPadding: false,
  },
  userInfoContainer: { 
    alignItems: 'center', 
    paddingVertical: 20 
  },
  userAvatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  userAvatarText: { 
    fontSize: 40 
  },
  userName: { 
    fontSize: 20, 
    fontWeight: '600', 
    marginBottom: 4, 
    includeFontPadding: false 
  },
  userRole: { 
    fontSize: 14, 
    marginBottom: 20, 
    includeFontPadding: false 
  },
  logoutButton: { 
    padding: 16, 
    borderRadius: 10, 
    alignItems: 'center', 
    minHeight: 50, 
    justifyContent: 'center', 
    marginHorizontal: 16, 
    marginBottom: 10 
  },
  logoutButtonText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600', 
    includeFontPadding: false 
  },
});