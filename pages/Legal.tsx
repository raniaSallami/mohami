import React from 'react';

const LegalLayout = ({ title, children, onBack }: { title: string, children: React.ReactNode, onBack: () => void }) => (
  <div className="min-h-screen bg-slate-50 font-sans" dir={document.documentElement.dir}>
    <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3 space-x-reverse cursor-pointer" onClick={onBack}>
          <img 
            src="/assets/logo.png" 
            alt={window.__t("المحامي")} 
            className="w-8 h-8 rounded-lg object-contain"
          />
          <span className="font-bold text-lg">{window.__t("المحامي")}</span>
        </div>
        <button onClick={onBack} className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded transition">
          {window.__t("العودة للرئيسية")}
        </button>
      </div>
    </nav>
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold text-slate-900 mb-8">{title}</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 prose prose-lg prose-slate max-w-none">
        {children}
      </div>
      <div className="mt-8 p-6 bg-slate-100 rounded-lg">
        <h3 className="font-bold text-slate-900 mb-4">{window.__t("معلومات الشركة")}</h3>
        <p className="text-sm text-slate-700 mb-2"><strong>{window.__t("الاسم:")}</strong> NOVALABS WEB DESIGN</p>
        <p className="text-sm text-slate-700 mb-2"><strong>{window.__t("العنوان:")}</strong> 2 Rue Lac Loch Ness, Tunis 1053, Tunis 1021</p>
        <p className="text-sm text-slate-700 mb-2"><strong>{window.__t("البريد الإلكتروني:")}</strong> contact@novalabs.tn</p>
        <p className="text-sm text-slate-700"><strong>{window.__t("الهاتف:")}</strong> +216 24 73 46 47</p>
      </div>
    </div>
  </div>
);

export const TermsPage = ({ onBack }: { onBack: () => void }) => (
  <LegalLayout title={window.__t("شروط الاستخدام")} onBack={onBack}>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("1. مقدمة وقبول الشروط")}</h2>
        <p className="mb-4">
          {window.__t("مرحباً بكم في منصة \"المحامي\" (المنصة) المملوكة والمدارة من قبل شركة")} <strong>NOVALABS WEB DESIGN</strong> 
          {window.__t("(المشار إليها فيما يلي بـ \"نحن\"، \"لنا\"، \"الشركة\"). باستخدام هذه المنصة، فإنك تقر بأنك قد قرأت وفهمت ووافقت على الالتزام بجميع الشروط والأحكام الواردة في هذه الوثيقة.")}
        </p>
        <p className="mb-4">
          {window.__t("إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام المنصة. نحن نحتفظ بالحق في تعديل هذه الشروط في أي وقت، وسيتم إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على المنصة.")}
        </p>
        <p className="mb-4">
          <strong>{window.__t("تاريخ آخر تحديث:")}</strong> {new Date().toLocaleDateString((document.documentElement.lang === 'ar' ? 'ar-TN' : 'fr-FR'), { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("2. تعريفات")}</h2>
        <ul className="list-disc list-inside space-y-2 mb-4">
          <li><strong>{window.__t("\"المنصة\"")}</strong> {window.__t("تشير إلى موقع الويب والتطبيق الإلكتروني \"المحامي\" وجميع الخدمات المرتبطة به.")}</li>
          <li><strong>{window.__t("\"المستخدم\"")}</strong> {window.__t("أو")} <strong>{window.__t("\"أنت\"")}</strong> {window.__t("يشير إلى أي شخص أو كيان قانوني يستخدم المنصة.")}</li>
          <li><strong>{window.__t("\"الخدمة\"")}</strong> {window.__t("تشير إلى جميع الخدمات المقدمة من خلال المنصة بما في ذلك التحليل بالذكاء الاصطناعي، إدارة القضايا، والمكتبة القانونية.")}</li>
          <li><strong>{window.__t("\"البيانات\"")}</strong> {window.__t("تشير إلى جميع المعلومات والملفات والوثائق التي تقوم برفعها أو إدخالها في المنصة.")}</li>
          <li><strong>{window.__t("\"الموكل\"")}</strong> {window.__t("يشير إلى العميل الذي يمثله المستخدم (المحامي) في القضايا القانونية.")}</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("3. قبول الشروط والقيود")}</h2>
        <p className="mb-4">
          <strong>3.1.</strong> {window.__t("يجب أن تكون قد بلغت سن الرشد القانوني (18 سنة) أو أن يكون لديك موافقة الوالدين أو الوصي القانوني لاستخدام هذه المنصة.")}
        </p>
        <p className="mb-4">
          <strong>3.2.</strong> {window.__t("أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور. أنت توافق على تحمل المسؤولية الكاملة عن جميع الأنشطة التي تحدث تحت حسابك.")}
        </p>
        <p className="mb-4">
          <strong>3.3.</strong> {window.__t("أنت توافق على استخدام المنصة فقط للأغراض القانونية والمهنية المشروعة. يمنع استخدام المنصة لأي أغراض غير قانونية أو احتيالية أو ضارة.")}
        </p>
        <p className="mb-4">
          <strong>3.4.</strong> {window.__t("أنت توافق على عدم محاولة الوصول غير المصرح به إلى المنصة أو أنظمتها أو شبكاتها.")}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("4. الخدمات المقدمة")}</h2>
        <p className="mb-4">
          <strong>4.1.</strong> {window.__t("تقدم المنصة خدمات مساعدة للمحامين تشمل:")}
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 me-4">
          <li>{window.__t("تحليل الوثائق القانونية باستخدام الذكاء الاصطناعي")}</li>
          <li>{window.__t("إدارة القضايا والمواعيد")}</li>
          <li>{window.__t("مكتبة قانونية للاستشارات")}</li>
          <li>{window.__t("تحليل العقود والوثائق")}</li>
          <li>{window.__t("خدمات الدردشة والدعم")}</li>
        </ul>
        <p className="mb-4">
          <strong>4.2.</strong> {window.__t("نحن نحتفظ بالحق في تعديل أو تعليق أو إيقاف أي جزء من الخدمات في أي وقت دون إشعار مسبق.")}
        </p>
        <p className="mb-4">
          <strong>4.3.</strong> {window.__t("نحن لا نضمن أن الخدمات ستكون متاحة بشكل مستمر أو خالية من الأخطاء.")}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("5. إخلاء المسؤولية المهم")}</h2>
        <div className="bg-yellow-50 border-e-4 border-yellow-400 p-4 mb-4">
          <p className="font-bold text-yellow-900 mb-2">{window.__t("⚠️ تنبيه قانوني مهم:")}</p>
          <p className="text-yellow-800">
            {window.__t("التحليلات والنتائج التي يقدمها الذكاء الاصطناعي في هذه المنصة هي")} <strong>{window.__t("أدوات مساعدة فقط")}</strong> 
            {window.__t("وليست بديلاً عن الرأي القانوني المهني أو الاستشارة القانونية المباشرة من محامٍ مؤهل.")}
          </p>
        </div>
        <p className="mb-4">
          <strong>5.1.</strong> {window.__t("نحن لا نقدم استشارات قانونية مباشرة ولا نكون علاقة محامي-موكل مع أي مستخدم.")}
        </p>
        <p className="mb-4">
          <strong>5.2.</strong> {window.__t("جميع التحليلات والنتائج المقدمة هي لأغراض إعلامية ومساعدة فقط. يجب عليك دائماً مراجعة جميع النتائج مع محامٍ مؤهل قبل اتخاذ أي قرارات قانونية.")}
        </p>
        <p className="mb-4">
          <strong>5.3.</strong> {window.__t("نحن لا نتحمل أي مسؤولية عن:")}
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 me-4">
          <li>{window.__t("أي قرارات قانونية تتخذها بناءً على التحليلات المقدمة")}</li>
          <li>{window.__t("أي أضرار أو خسائر ناتجة عن استخدام أو عدم القدرة على استخدام الخدمات")}</li>
          <li>{window.__t("أي أخطاء أو إغفالات في التحليلات المقدمة")}</li>
          <li>{window.__t("أي انتهاكات للقوانين أو اللوائح من قبل المستخدم")}</li>
          <li>{window.__t("أي خسائر تجارية أو بيانات أو أرباح محتملة")}</li>
        </ul>
        <p className="mb-4">
          <strong>5.4.</strong> {window.__t("أنت توافق صراحة على أن استخدامك للخدمات يكون على مسؤوليتك الخاصة وأنك تتحمل جميع المخاطر المرتبطة بذلك.")}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("6. حقوق الملكية الفكرية")}</h2>
        <p className="mb-4">
          <strong>6.1.</strong> {window.__t("جميع المحتويات الموجودة على هذه المنصة، بما في ذلك على سبيل المثال لا الحصر: النصوص، التصاميم، الشعارات، الأكواد البرمجية، الواجهات، الرسوم البيانية، الصور، والأيقونات، هي ملكية حصرية لشركة")} <strong>NOVALABS WEB DESIGN</strong> {window.__t("ومحمية بموجب قوانين حقوق الملكية الفكرية التونسية والدولية.")}
        </p>
        <p className="mb-4">
          <strong>6.2.</strong> {window.__t("يتم منحك رخصة محدودة وغير حصرية وغير قابلة للتحويل لاستخدام المنصة لأغراضك المهنية الشخصية فقط. يمنع منعاً باتاً:")}
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 me-4">
          <li>{window.__t("نسخ أو إعادة إنتاج أو توزيع أي جزء من المنصة")}</li>
          <li>{window.__t("عكس هندسة أو محاولة استخراج الكود المصدري")}</li>
          <li>{window.__t("إنشاء أعمال مشتقة بناءً على المنصة")}</li>
          <li>{window.__t("استخدام المنصة لأغراض تجارية غير مصرح بها")}</li>
          <li>{window.__t("إزالة أو تعديل أي إشعارات حقوق الملكية")}</li>
        </ul>
        <p className="mb-4">
          <strong>6.3.</strong> {window.__t("جميع العلامات التجارية والأسماء التجارية المستخدمة في المنصة هي ملكية لأصحابها المعنيين. استخدامك للمنصة لا يمنحك أي حقوق في هذه العلامات التجارية.")}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("7. بيانات المستخدم والملفات")}</h2>
        <p className="mb-4">
          <strong>7.1.</strong> {window.__t("أنت تحتفظ بجميع حقوق الملكية في البيانات والملفات التي تقوم برفعها إلى المنصة.")}
        </p>
        <p className="mb-4">
          <strong>7.2.</strong> {window.__t("من خلال رفع البيانات، تمنحنا ترخيصاً محدوداً لاستخدام هذه البيانات فقط لتقديم الخدمات المطلوبة ومعالجة طلباتك.")}
        </p>
        <p className="mb-4">
          <strong>7.3.</strong> {window.__t("نحن لا نستخدم بياناتك أو ملفاتك لتدريب نماذج الذكاء الاصطناعي العامة أو مشاركتها مع أطراف ثالثة لأغراض تجارية.")}
        </p>
        <p className="mb-4">
          <strong>7.4.</strong> {window.__t("أنت مسؤول عن التأكد من أن لديك جميع الحقوق والتراخيص اللازمة لرفع أي بيانات أو ملفات إلى المنصة.")}
        </p>
        <p className="mb-4">
          <strong>7.5.</strong> {window.__t("نحن لا نتحمل أي مسؤولية عن محتوى البيانات التي تقوم برفعها أو عن أي انتهاكات لحقوق الملكية الفكرية من قبل المستخدم.")}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("8. الاشتراكات والدفع")}</h2>
        <p className="mb-4">
          <strong>8.1.</strong> {window.__t("تقدم المنصة خطط اشتراك مختلفة (البداية، المحترف، المكتب) بأسعار وقيود مختلفة.")}
        </p>
        <p className="mb-4">
          <strong>8.2.</strong> {window.__t("جميع الأسعار معروضة بالدينار التونسي (د.ت) وقد تكون قابلة للتغيير دون إشعار مسبق.")}
        </p>
        <p className="mb-4">
          <strong>8.3.</strong> {window.__t("الدفع يتم عبر التحويل البنكي. نحن لا نتحمل مسؤولية أي تأخير في معالجة التحويلات من قبل البنوك.")}
        </p>
        <p className="mb-4">
          <strong>8.4.</strong> {window.__t("جميع المدفوعات غير قابلة للاسترداد إلا في حالات محددة بموجب القانون التونسي.")}
        </p>
        <p className="mb-4">
          <strong>8.5.</strong> {window.__t("نحن نحتفظ بالحق في رفض أو إلغاء أي اشتراك في أي وقت لأسباب تتعلق بالأمان أو انتهاك الشروط.")}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("9. إيقاف الحساب")}</h2>
        <p className="mb-4">
          <strong>9.1.</strong> {window.__t("يمكنك إلغاء حسابك في أي وقت من خلال إعدادات الحساب أو التواصل معنا.")}
        </p>
        <p className="mb-4">
          <strong>9.2.</strong> {window.__t("نحن نحتفظ بالحق في تعليق أو إيقاف حسابك فوراً ودون إشعار مسبق في حالة:")}
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 me-4">
          <li>{window.__t("انتهاكك لأي من هذه الشروط")}</li>
          <li>{window.__t("استخدامك للمنصة لأغراض غير قانونية")}</li>
          <li>{window.__t("عدم دفع الرسوم المستحقة")}</li>
          <li>{window.__t("أي نشاط يشكل تهديداً لأمن المنصة أو مستخدميها")}</li>
        </ul>
        <p className="mb-4">
          <strong>9.3.</strong> {window.__t("في حالة إيقاف حسابك، قد نفقد أو نحذف بياناتك وفقاً لسياسة الخصوصية.")}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("10. التعديلات على الشروط")}</h2>
        <p className="mb-4">
          <strong>10.1.</strong> {window.__t("نحن نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم نشر النسخة المحدثة على المنصة مع تحديث تاريخ \"آخر تحديث\".")}
        </p>
        <p className="mb-4">
          <strong>10.2.</strong> {window.__t("سيتم إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني المسجل في حسابك أو إشعار على المنصة.")}
        </p>
        <p className="mb-4">
          <strong>10.3.</strong> {window.__t("استمرارك في استخدام المنصة بعد نشر التعديلات يعتبر موافقة منك على الشروط المحدثة.")}
        </p>
        <p className="mb-4">
          <strong>10.4.</strong> {window.__t("إذا كنت لا توافق على التعديلات، يجب عليك إيقاف استخدام المنصة فوراً.")}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("11. القانون الحاكم والولاية القضائية")}</h2>
        <p className="mb-4">
          <strong>11.1.</strong> {window.__t("تخضع هذه الشروط وتفسر وفقاً لقوانين الجمهورية التونسية.")}
        </p>
        <p className="mb-4">
          <strong>11.2.</strong> {window.__t("أي نزاعات تنشأ عن أو تتعلق بهذه الشروط أو استخدام المنصة تخضع للولاية القضائية الحصرية لمحاكم تونس.")}
        </p>
        <p className="mb-4">
          <strong>11.3.</strong> {window.__t("في حالة وجود أي نزاع، يجب على الأطراف محاولة حله ودياً أولاً قبل اللجوء إلى القضاء.")}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("12. أحكام عامة")}</h2>
        <p className="mb-4">
          <strong>12.1.</strong> {window.__t("إذا تم اعتبار أي حكم من هذه الشروط غير صالح أو غير قابل للتنفيذ، فإن باقي الأحكام تبقى سارية ومفعول.")}
        </p>
        <p className="mb-4">
          <strong>12.2.</strong> {window.__t("عدم ممارستنا لأي حق من الحقوق المنصوص عليها في هذه الشروط لا يعتبر تنازلاً عن هذا الحق.")}
        </p>
        <p className="mb-4">
          <strong>12.3.</strong> {window.__t("هذه الشروط تشكل الاتفاق الكامل بينك وبيننا فيما يتعلق باستخدام المنصة وتحل محل جميع الاتفاقيات السابقة.")}
        </p>
        <p className="mb-4">
          <strong>12.4.</strong> {window.__t("لا يجوز لك نقل أو تفويض أي من حقوقك أو التزاماتك بموجب هذه الشروط دون موافقتنا الخطية المسبقة.")}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("13. الاتصال بنا")}</h2>
        <p className="mb-4">
          {window.__t("إذا كان لديك أي أسئلة أو استفسارات حول هذه الشروط، يرجى التواصل معنا على:")}
        </p>
        <ul className="list-none space-y-2 mb-4">
          <li><strong>{window.__t("البريد الإلكتروني:")}</strong> contact@novalabs.tn</li>
          <li><strong>{window.__t("الهاتف:")}</strong> +216 24 73 46 47</li>
          <li><strong>{window.__t("العنوان:")}</strong> 2 Rue Lac Loch Ness, Tunis 1053, Tunis 1021</li>
        </ul>
      </section>
    </div>
  </LegalLayout>
);

export const PrivacyPage = ({ onBack }: { onBack: () => void }) => (
  <LegalLayout title={window.__t("سياسة الخصوصية")} onBack={onBack}>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("1. مقدمة")}</h2>
        <p className="mb-4">
          {window.__t("تحترم شركة")} <strong>NOVALABS WEB DESIGN</strong> {window.__t("(المشار إليها بـ \"نحن\"، \"لنا\"، \"الشركة\") خصوصيتك وتلتزم بحماية بياناتك الشخصية. تشرح هذه السياسة كيف نجمع ونستخدم ونحمي معلوماتك عند استخدامك لمنصة \"المحامي\".")}
        </p>
        <p className="mb-4">
          {window.__t("نحن ملتزمون بالامتثال الكامل لقانون حماية البيانات الشخصية التونسي (قانون 2004-63) واللوائح الأوروبية العامة لحماية البيانات (GDPR) حيثما ينطبق.")}
        </p>
        <p className="mb-4">
          <strong>{window.__t("تاريخ آخر تحديث:")}</strong> {new Date().toLocaleDateString((document.documentElement.lang === 'ar' ? 'ar-TN' : 'fr-FR'), { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("2. البيانات التي نجمعها")}</h2>
        <h3 className="text-xl font-bold text-slate-800 mb-3">{window.__t("2.1. البيانات الشخصية")}</h3>
        <p className="mb-4">
          {window.__t("نجمع البيانات التالية عند التسجيل واستخدام المنصة:")}
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 me-4">
          <li><strong>{window.__t("معلومات الهوية:")}</strong> {window.__t("الاسم الكامل، البريد الإلكتروني، رقم الهاتف (اختياري)")}</li>
          <li><strong>{window.__t("معلومات الحساب:")}</strong> {window.__t("كلمة المرور (مشفرة)، نوع الاشتراك، حالة الحساب")}</li>
          <li><strong>{window.__t("معلومات المهنة:")}</strong> {window.__t("نوع الممارسة القانونية، التخصص (إن وجد)")}</li>
          <li><strong>{window.__t("معلومات الاستخدام:")}</strong> {window.__t("سجل تسجيل الدخول، الصفحات التي تزورها، الميزات المستخدمة")}</li>
        </ul>

        <h3 className="text-xl font-bold text-slate-800 mb-3">{window.__t("2.2. البيانات الحساسة (ملفات القضايا)")}</h3>
        <p className="mb-4">
          {window.__t("عند رفع ملفات القضايا والوثائق القانونية:")}
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 me-4">
          <li>{window.__t("نقوم بتخزين الملفات التي ترفعها فقط لغرض المعالجة والتحليل")}</li>
          <li>{window.__t("لا نستخدم هذه الملفات لتدريب نماذج الذكاء الاصطناعي العامة")}</li>
          <li>{window.__t("لا نشارك هذه الملفات مع أي أطراف ثالثة")}</li>
          <li>{window.__t("نحتفظ بالملفات فقط طوال مدة اشتراكك النشط")}</li>
        </ul>

        <h3 className="text-xl font-bold text-slate-800 mb-3">{window.__t("2.3. البيانات التقنية")}</h3>
        <p className="mb-4">
          {window.__t("نجمع تلقائياً معلومات تقنية عند استخدام المنصة:")}
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 me-4">
          <li>{window.__t("عنوان IP")}</li>
          <li>{window.__t("نوع المتصفح ونظام التشغيل")}</li>
          <li>{window.__t("معرفات الأجهزة")}</li>
          <li>{window.__t("سجلات الوصول والأنشطة")}</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("3. كيف نستخدم بياناتك")}</h2>
        <p className="mb-4">
          <strong>{window.__t("3.1. تقديم الخدمات:")}</strong> {window.__t("نستخدم بياناتك لتقديم وتحسين خدمات المنصة، بما في ذلك:")}
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 me-4">
          <li>{window.__t("معالجة وتحليل الوثائق القانونية التي ترفعها")}</li>
          <li>{window.__t("إدارة حسابك واشتراكك")}</li>
          <li>{window.__t("توفير الدعم الفني والرد على استفساراتك")}</li>
          <li>{window.__t("إرسال إشعارات مهمة متعلقة بخدمتك")}</li>
        </ul>

        <p className="mb-4">
          <strong>{window.__t("3.2. الأمان والامتثال:")}</strong> {window.__t("نستخدم بياناتك لـ:")}
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 me-4">
          <li>{window.__t("التحقق من هويتك ومنع الاحتيال")}</li>
          <li>{window.__t("ضمان الامتثال للقوانين واللوائح")}</li>
          <li>{window.__t("حماية أمن المنصة ومستخدميها")}</li>
        </ul>

        <p className="mb-4">
          <strong>{window.__t("3.3. التحسينات:")}</strong> {window.__t("نستخدم بيانات مجمعة وغير قابلة للتعريف لتحسين أداء المنصة وتجربة المستخدم.")}
        </p>

        <p className="mb-4">
          <strong>{window.__t("3.4. التواصل:")}</strong> {window.__t("قد نستخدم بريدك الإلكتروني لإرسال:")}
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 me-4">
          <li>{window.__t("إشعارات مهمة عن حسابك")}</li>
          <li>{window.__t("تحديثات عن الخدمات")}</li>
          <li>{window.__t("رسائل تسويقية (يمكنك إلغاء الاشتراك في أي وقت)")}</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("4. حماية البيانات والتشفير")}</h2>
        <div className="bg-blue-50 border-e-4 border-blue-400 p-4 mb-4">
          <p className="font-bold text-blue-900 mb-2">{window.__t("🔒 التزامنا بأمن البيانات:")}</p>
          <p className="text-blue-800">
            {window.__t("نحن نستخدم أحدث تقنيات التشفير والأمان لحماية بياناتك. جميع البيانات الحساسة يتم تشفيرها أثناء النقل والتخزين.")}
          </p>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-3">{window.__t("4.1. التشفير أثناء النقل (In-Transit Encryption)")}</h3>
        <p className="mb-4">
          {window.__t("جميع الاتصالات بين متصفحك وخوادمنا محمية بتشفير SSL/TLS (HTTPS) باستخدام بروتوكولات التشفير الحديثة:")}
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 me-4">
          <li><strong>TLS 1.3:</strong> {window.__t("أحدث بروتوكول تشفير آمن")}</li>
          <li><strong>{window.__t("شهادات SSL:")}</strong> {window.__t("شهادات موقعة من سلطة معتمدة")}</li>
          <li><strong>Perfect Forward Secrecy:</strong> {window.__t("ضمان عدم كشف البيانات السابقة حتى في حالة اختراق المفاتيح")}</li>
        </ul>
        <div className="bg-gray-100 p-3 rounded mb-4 font-mono text-sm">
          <p className="text-xs text-gray-600 mb-1">{window.__t("مثال تقني:")}</p>
          <code>HTTPS://platform.com → TLS 1.3 Encryption → Secure Server</code>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-3">{window.__t("4.2. التشفير أثناء التخزين (At-Rest Encryption)")}</h3>
        <p className="mb-4">
          {window.__t("جميع البيانات المخزنة في قاعدة البيانات محمية بتشفير على مستوى قاعدة البيانات:")}
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 me-4">
          <li><strong>{window.__t("تشفير قاعدة البيانات:")}</strong> {window.__t("PostgreSQL مع تشفير AES-256")}</li>
          <li><strong>{window.__t("تشفير الملفات:")}</strong> {window.__t("جميع الملفات المرفوعة مشفرة قبل التخزين")}</li>
          <li><strong>{window.__t("تشفير كلمات المرور:")}</strong> {window.__t("كلمات المرور مشفرة باستخدام خوارزميات hash آمنة (bcrypt/scrypt)")}</li>
        </ul>
        <div className="bg-gray-100 p-3 rounded mb-4 font-mono text-sm">
          <p className="text-xs text-gray-600 mb-1">{window.__t("مثال تقني لتشفير كلمة المرور:")}</p>
          <code>Password: "user123" → Hash: "$2b$10$N9qo8uLOickgx2ZMRZoMye..."</code>
          <p className="text-xs text-gray-600 mt-1">{window.__t("(لا يمكن عكس هذا التشفير)")}</p>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-3">{window.__t("4.3. عدم تخزين البيانات الحساسة")}</h3>
        <p className="mb-4">
          <strong>{window.__t("نؤكد صراحة:")}</strong> {window.__t("نحن")} <strong>{window.__t("لا نخزن")}</strong> {window.__t("البيانات التالية في أي مكان في منصتنا:")}
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 me-4">
          <li>{window.__t("كلمات المرور في نص واضح (يتم hash فقط)")}</li>
          <li>{window.__t("معلومات بطاقات الائتمان (لا نقبلها أصلاً)")}</li>
          <li>{window.__t("بيانات الموكلين في سجلات غير مشفرة")}</li>
          <li>{window.__t("محتوى الوثائق في سجلات النظام أو ملفات السجل")}</li>
        </ul>
        <div className="bg-gray-100 p-3 rounded mb-4 font-mono text-sm">
          <p className="text-xs text-gray-600 mb-1">{window.__t("مثال من الكود - لا نستخدم:")}</p>
          <code className="text-red-600">{window.__t("❌ console.log(password) // محظور تماماً")}</code><br/>
          <code className="text-red-600">{window.__t("❌ localStorage.setItem('sensitiveData', data) // محظور")}</code><br/>
          <code className="text-green-600">{window.__t("✅ const hashed = await bcrypt.hash(password, 10) // صحيح")}</code>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-3">{window.__t("4.4. أمان قاعدة البيانات")}</h3>
        <p className="mb-4">
          {window.__t("قاعدة البيانات محمية بـ:")}
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 me-4">
          <li><strong>{window.__t("جدران الحماية (Firewalls):")}</strong> {window.__t("منع الوصول غير المصرح به")}</li>
          <li><strong>{window.__t("الوصول المقيد:")}</strong> {window.__t("فقط الخوادم المصرح بها يمكنها الوصول")}</li>
          <li><strong>{window.__t("النسخ الاحتياطي المشفر:")}</strong> {window.__t("جميع النسخ الاحتياطية مشفرة")}</li>
          <li><strong>{window.__t("مراقبة الوصول:")}</strong> {window.__t("تسجيل جميع محاولات الوصول")}</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("5. موقع الخوادم والتخزين")}</h2>
        <div className="bg-green-50 border-e-4 border-green-400 p-4 mb-4">
          <p className="font-bold text-green-900 mb-2">{window.__t("🇹🇳 التزامنا بالسيادة الرقمية:")}</p>
          <p className="text-green-800">
            {window.__t("جميع خوادمنا ومراكز البيانات موجودة داخل الأراضي التونسية. لا يتم نقل أو تخزين بياناتك خارج تونس إلا بموافقتك الصريحة أو بموجب القانون.")}
          </p>
        </div>
        <p className="mb-4">
          <strong>5.1.</strong> {window.__t("الخوادم الرئيسية: تونس - مركز بيانات معتمد")}
        </p>
        <p className="mb-4">
          <strong>5.2.</strong> {window.__t("قاعدة البيانات: PostgreSQL على خوادم محلية في تونس")}
        </p>
        <p className="mb-4">
          <strong>5.3.</strong> {window.__t("النسخ الاحتياطي: يتم تخزين النسخ الاحتياطية في موقع ثانوي داخل تونس")}
        </p>
        <p className="mb-4">
          <strong>5.4.</strong> {window.__t("في حالة الحاجة لنقل بيانات خارج تونس (مثل استخدام خدمات سحابية دولية)، سنحصل على موافقتك الصريحة ونضمن أن هذه الخدمات ملتزمة بمعايير حماية البيانات الدولية.")}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("6. مشاركة البيانات مع أطراف ثالثة")}</h2>
        <p className="mb-4">
          <strong>6.1.</strong> {window.__t("نحن")} <strong>{window.__t("لا نبيع")}</strong> {window.__t("بياناتك الشخصية لأي طرف ثالث.")}
        </p>
        <p className="mb-4">
          <strong>6.2.</strong> {window.__t("قد نشارك بياناتك فقط في الحالات التالية:")}
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 me-4">
          <li><strong>{window.__t("مقدمي الخدمات:")}</strong> {window.__t("مع شركات موثوقة تساعدنا في تشغيل المنصة (مثل استضافة الخوادم، معالجة المدفوعات) - وهؤلاء ملزمون بمعايير حماية البيانات نفسها")}</li>
          <li><strong>{window.__t("الامتثال القانوني:")}</strong> {window.__t("عندما يتطلب القانون ذلك (مثل أمر قضائي)")}</li>
          <li><strong>{window.__t("حماية الحقوق:")}</strong> {window.__t("لحماية حقوقنا أو حقوق المستخدمين الآخرين")}</li>
          <li><strong>{window.__t("بموافقتك:")}</strong> {window.__t("عندما تمنحنا موافقة صريحة")}</li>
        </ul>
        <p className="mb-4">
          <strong>6.3.</strong> {window.__t("نحن")} <strong>{window.__t("لا نستخدم")}</strong> {window.__t("بياناتك أو ملفاتك لتدريب نماذج الذكاء الاصطناعي العامة أو مشاركتها مع شركات التكنولوجيا لأغراض التدريب.")}
        </p>
        <p className="mb-4">
          <strong>6.4.</strong> {window.__t("جميع مقدمي الخدمات من الأطراف الثالثة ملزمون بمعايير حماية البيانات الصارمة ويمنعون من استخدام بياناتك لأي غرض آخر غير المتفق عليه.")}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("7. حقوقك في بياناتك")}</h2>
        <p className="mb-4">
          {window.__t("بموجب قانون حماية البيانات التونسي، لديك الحقوق التالية:")}
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 me-4">
          <li><strong>{window.__t("حق الوصول:")}</strong> {window.__t("يمكنك طلب نسخة من جميع بياناتك الشخصية")}</li>
          <li><strong>{window.__t("حق التصحيح:")}</strong> {window.__t("يمكنك تصحيح أي بيانات غير دقيقة")}</li>
          <li><strong>{window.__t("حق الحذف:")}</strong> {window.__t("يمكنك طلب حذف بياناتك (مع مراعاة الالتزامات القانونية)")}</li>
          <li><strong>{window.__t("حق الاعتراض:")}</strong> {window.__t("يمكنك الاعتراض على معالجة بياناتك")}</li>
          <li><strong>{window.__t("حق التنقل:")}</strong> {window.__t("يمكنك طلب نقل بياناتك إلى خدمة أخرى")}</li>
          <li><strong>{window.__t("حق سحب الموافقة:")}</strong> {window.__t("يمكنك سحب موافقتك على معالجة بياناتك في أي وقت")}</li>
        </ul>
        <p className="mb-4">
          {window.__t("لممارسة أي من هذه الحقوق، يرجى التواصل معنا على:")} <strong>contact@novalabs.tn</strong>
        </p>
        <p className="mb-4">
          {window.__t("سنرد على طلبك خلال 30 يوماً من تاريخ استلامه.")}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("8. ملفات تعريف الارتباط (Cookies)")}</h2>
        <p className="mb-4">
          <strong>8.1.</strong> {window.__t("نستخدم ملفات تعريف الارتباط لتحسين تجربة استخدامك للمنصة:")}
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 me-4">
          <li><strong>{window.__t("ملفات أساسية:")}</strong> {window.__t("ضرورية لعمل المنصة (مثل حفظ جلسة تسجيل الدخول)")}</li>
          <li><strong>{window.__t("ملفات وظيفية:")}</strong> {window.__t("لحفظ تفضيلاتك (مثل اللغة، الوضع الليلي)")}</li>
          <li><strong>{window.__t("ملفات تحليلية:")}</strong> {window.__t("لفهم كيفية استخدام المنصة (مجمعة وغير قابلة للتعريف)")}</li>
        </ul>
        <p className="mb-4">
          <strong>8.2.</strong> {window.__t("يمكنك إدارة ملفات تعريف الارتباط من إعدادات المتصفح، لكن قد يؤثر ذلك على وظائف المنصة.")}
        </p>
        <p className="mb-4">
          <strong>8.3.</strong> {window.__t("لا نستخدم ملفات تعريف الارتباط للتتبع عبر المواقع أو الإعلانات المستهدفة.")}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("9. مدة الاحتفاظ بالبيانات")}</h2>
        <p className="mb-4">
          <strong>9.1.</strong> {window.__t("نحتفظ ببياناتك الشخصية طالما كان حسابك نشطاً أو حسب الحاجة لتقديم الخدمات.")}
        </p>
        <p className="mb-4">
          <strong>9.2.</strong> {window.__t("عند إلغاء حسابك، سنحذف بياناتك الشخصية خلال 30 يوماً، إلا إذا كان القانون يتطلب الاحتفاظ بها لفترة أطول.")}
        </p>
        <p className="mb-4">
          <strong>9.3.</strong> {window.__t("قد نحتفظ ببعض البيانات المجمعة وغير القابلة للتعريف لأغراض إحصائية وتحليلية.")}
        </p>
        <p className="mb-4">
          <strong>9.4.</strong> {window.__t("ملفات القضايا والوثائق: يتم حذفها تلقائياً بعد 90 يوماً من إلغاء الحساب، ما لم تطلب حذفها فوراً.")}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("10. أمان البيانات")}</h2>
        <p className="mb-4">
          <strong>10.1.</strong> {window.__t("نستخدم تدابير أمنية تقنية وإدارية صارمة لحماية بياناتك:")}
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 me-4">
          <li>{window.__t("تشفير جميع البيانات الحساسة")}</li>
          <li>{window.__t("جدران الحماية وأنظمة كشف التسلل")}</li>
          <li>{window.__t("الوصول المقيد للبيانات (مبدأ أقل صلاحية)")}</li>
          <li>{window.__t("مراقبة مستمرة للأنشطة المشبوهة")}</li>
          <li>{window.__t("تدريب موظفينا على أمان البيانات")}</li>
          <li>{window.__t("اختبارات أمنية منتظمة")}</li>
        </ul>
        <p className="mb-4">
          <strong>10.2.</strong> {window.__t("ومع ذلك، لا يمكن ضمان الأمان المطلق 100%. أنت توافق على أن استخدام الإنترنت والمنصة ينطوي على مخاطر أمنية.")}
        </p>
        <p className="mb-4">
          <strong>10.3.</strong> {window.__t("في حالة حدوث خرق أمني، سنقوم بإشعارك والسلطات المختصة خلال 72 ساعة وفقاً للقانون.")}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("11. خصوصية الأطفال")}</h2>
        <p className="mb-4">
          {window.__t("المنصة مخصصة للمحامين المحترفين فقط. لا نجمع عمداً بيانات من أشخاص دون سن 18 عاماً. إذا اكتشفنا أننا جمعنا بيانات من قاصر، سنحذفها فوراً.")}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("12. التغييرات على سياسة الخصوصية")}</h2>
        <p className="mb-4">
          {window.__t("قد نحدث هذه السياسة من وقت لآخر. سيتم إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على المنصة. استمرارك في استخدام المنصة بعد التغييرات يعتبر موافقة منك.")}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{window.__t("13. التواصل معنا")}</h2>
        <p className="mb-4">
          {window.__t("إذا كان لديك أي أسئلة أو مخاوف حول سياسة الخصوصية أو معالجة بياناتك، يرجى التواصل معنا:")}
        </p>
        <ul className="list-none space-y-2 mb-4">
          <li><strong>{window.__t("البريد الإلكتروني:")}</strong> contact@novalabs.tn</li>
          <li><strong>{window.__t("الهاتف:")}</strong> +216 24 73 46 47</li>
          <li><strong>{window.__t("العنوان:")}</strong> 2 Rue Lac Loch Ness, Tunis 1053, Tunis 1021</li>
        </ul>
        <p className="mb-4">
          {window.__t("لديك أيضاً الحق في تقديم شكوى إلى الهيئة الوطنية لحماية البيانات الشخصية في تونس إذا كنت تعتقد أن معالجة بياناتك تنتهك القانون.")}
        </p>
      </section>
    </div>
  </LegalLayout>
);
