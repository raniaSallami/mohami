import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { Mail, Phone, Building2, Scale, GraduationCap, FileText, Calendar, Shield, CheckCircle2, Camera, Loader2, Trash2 } from 'lucide-react';
import { apiService } from '../services/apiService';
import { toast } from 'sonner';

export const ProfilePage = ({ 
  user, 
  onNavigate,
  onUpdateUser
}: { 
  user: User;
  onNavigate: (page: string) => void;
  onUpdateUser?: (user: User) => void;
}) => {
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAccountTypeLabel = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'lawyer':
        return { label: 'محامي', icon: <Scale className="w-5 h-5" />, color: 'bg-blue-100 text-blue-700' };
      case 'student':
        return { label: 'طالب', icon: <GraduationCap className="w-5 h-5" />, color: 'bg-purple-100 text-purple-700' };
      case 'cabinet':
        return { label: 'مكتب قانوني', icon: <Building2 className="w-5 h-5" />, color: 'bg-amber-100 text-amber-700' };
      default:
        return { label: 'مستخدم', icon: <FileText className="w-5 h-5" />, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const getPlanLabel = (plan?: string) => {
    switch (plan?.toLowerCase()) {
      case 'basic':
        return { label: 'البداية', color: 'text-blue-600', bgColor: 'bg-blue-50' };
      case 'pro':
        return { label: 'المحترف', color: 'text-amber-600', bgColor: 'bg-amber-50' };
      case 'enterprise':
        return { label: 'المكتب', color: 'text-purple-600', bgColor: 'bg-purple-50' };
      default:
        return { label: 'غير محدد', color: 'text-gray-600', bgColor: 'bg-gray-50' };
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة كبير جداً (الحد الأقصى 5 MB)');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى تحميل صورة صحيحة');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const updatedUser = await apiService.updateProfile({ avatar: file } as any);
      if (onUpdateUser) onUpdateUser(updatedUser);
      toast.success('تم تحديث صورة الملف بنجاح!');
    } catch (error) {
      toast.error('فشل تحميل الصورة. حاول مرة أخرى');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async () => {
    setShowDeleteConfirm(false);
    setIsUploadingPhoto(true);
    try {
      const updatedUser = await apiService.updateProfile({ deleteAvatar: true } as any);
      if (onUpdateUser) onUpdateUser(updatedUser);
      toast.success('تم حذف الصورة بنجاح');
    } catch (error) {
      toast.error('فشل حذف الصورة');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const accountType = getAccountTypeLabel(user.account_type || 'lawyer');
  const planInfo = getPlanLabel(user.subscriptionPlan);
  const isLawyer = user.account_type?.toLowerCase() === 'lawyer';
  const isCabinet = user.account_type?.toLowerCase() === 'cabinet';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">ملف المستخدم</h1>
          <p className="text-slate-600 dark:text-slate-400">معلومات حسابك الشخصية</p>
        </div>

        {/* Main Profile Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* Profile Header with Avatar */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-8 relative">
            <div className="flex items-start justify-between">
              <div className="flex items-end gap-6">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center shadow-2xl border-4 border-white/20 overflow-hidden ring-4 ring-amber-500/30 transition-transform hover:scale-105 duration-300">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                        <span className="text-4xl font-bold text-white uppercase">{user.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute -bottom-2 inset-x-0 flex justify-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="bg-white/90 backdrop-blur-sm text-slate-700 p-2.5 rounded-xl shadow-lg hover:bg-white hover:text-amber-600 transition-all duration-200 border border-white/50 group-hover:translate-y-[-2px]"
                      title="تغيير الصورة"
                    >
                      {isUploadingPhoto ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </button>
                    {user.avatar && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isUploadingPhoto}
                        className="bg-white/90 backdrop-blur-sm text-slate-700 p-2.5 rounded-xl shadow-lg hover:bg-white hover:text-red-500 transition-all duration-200 border border-white/50 group-hover:translate-y-[-2px]"
                        title="حذف الصورة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={isUploadingPhoto}
                  />
                </div>
                <div className="pt-2">
                  <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">{user.name}</h2>
                  <div className="flex items-center gap-2 text-amber-100/80 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm text-sm border border-white/10">
                    <Mail className="w-3.5 h-3.5" />
                    {user.email}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('settings')}
                className="bg-white text-amber-600 px-4 py-2 rounded-lg font-semibold hover:bg-amber-50 transition-colors"
              >
                تعديل الملف
              </button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Account Type */}
              <div className={`rounded-xl p-6 ${accountType.color} flex items-center gap-4`}>
                {accountType.icon}
                <div>
                  <p className="text-sm opacity-75">نوع الحساب</p>
                  <p className="text-xl font-bold">{accountType.label}</p>
                </div>
              </div>

              {/* Subscription Plan */}
              <div className={`rounded-xl p-6 ${planInfo.bgColor} flex items-center gap-4`}>
                <Shield className={`w-5 h-5 ${planInfo.color}`} />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">الخطة الحالية</p>
                  <p className={`text-xl font-bold ${planInfo.color}`}>{planInfo.label}</p>
                </div>
              </div>
            </div>

            {/* Subscription Status */}
            {user.subscriptionStatus && (
              <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg flex items-center gap-3">
                <CheckCircle2 className={`w-5 h-5 ${
                  user.subscriptionStatus === 'active' ? 'text-green-500' :
                  user.subscriptionStatus === 'pending_approval' ? 'text-yellow-500' : 'text-red-500'
                }`} />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">حالة الاشتراك</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {user.subscriptionStatus === 'active' ? 'نشط' :
                     user.subscriptionStatus === 'pending_approval' ? 'في انتظار الموافقة' : 'منتهي الصلاحية'}
                  </p>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">المعلومات الشخصية</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <Mail className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 dark:text-slate-400">البريد الإلكتروني</p>
                    <p className="font-medium text-slate-900 dark:text-white">{user.email}</p>
                  </div>
                  {user.email_verified && (
                    <div className="flex items-center gap-1.5 text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>مفعل</span>
                    </div>
                  )}
                </div>

                {user.phone && (
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <Phone className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">رقم الهاتف</p>
                      <p className="font-medium text-slate-900 dark:text-white">{user.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Professional Information */}
            {(isLawyer || isCabinet) && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">المعلومات المهنية</h3>
                <div className="space-y-4">
                  {user.bar_number && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400">رقم بطاقة المحامي</p>
                      <p className="font-medium text-slate-900 dark:text-white">{user.bar_number}</p>
                    </div>
                  )}

                  {user.cabinet_name && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400">اسم المكتب</p>
                      <p className="font-medium text-slate-900 dark:text-white">{user.cabinet_name}</p>
                    </div>
                  )}

                  {user.bar_registration_number && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400">رقم التسجيل بنقابة المحامين</p>
                      <p className="font-medium text-slate-900 dark:text-white">{user.bar_registration_number}</p>
                    </div>
                  )}

                  {user.office_address && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400">عنوان المكتب</p>
                      <p className="font-medium text-slate-900 dark:text-white">{user.office_address}</p>
                    </div>
                  )}

                  {user.number_of_lawyers && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400">عدد المحامين</p>
                      <p className="font-medium text-slate-900 dark:text-white">{user.number_of_lawyers}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Academic Information */}
            {user.university && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">المعلومات الأكاديمية</h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400">الجامعة</p>
                  <p className="font-medium text-slate-900 dark:text-white">{user.university}</p>
                </div>
              </div>
            )}

            {/* Account Information */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">معلومات الحساب</h3>
              <div className="space-y-4">
                {user.created_at && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">تاريخ الإنشاء</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {new Date(user.created_at).toLocaleDateString('ar-TN', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">حذف الصورة الشخصية</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف صورة ملفك الشخصي؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              
              <div className="flex flex-row-reverse gap-3">
                <button
                  onClick={handleDeletePhoto}
                  className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                >
                  نعم، احذف
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl hover:bg-slate-200 transition-colors border border-slate-200"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
