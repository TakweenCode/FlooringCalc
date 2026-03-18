import { useState, useEffect } from 'react';
import { Plus, Trash2, Sun, Moon, Calculator, Users, X, Copy, CheckCircle, RotateCcw } from 'lucide-react';
import { db } from './firebase';
import { doc, onSnapshot, setDoc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [rooms, setRooms] = useState([{ id: Date.now(), name: '', length: '', width: '' }]);
  const [prices, setPrices] = useState({ materialPrice: '', installationPrice: '', deliveryFee: '' });
  const [wastePercentage, setWastePercentage] = useState('10');
  const [results, setResults] = useState<any>(null);
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [activeModal, setActiveModal] = useState<'howToUse' | 'privacy' | 'disclaimer' | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const docRef = doc(db, 'stats', 'calculator');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setUsageCount(docSnap.data().usageCount);
      } else {
        setUsageCount(0);
      }
    }, (error) => {
      console.error("Error fetching usage count:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const addRoom = () => {
    setRooms([...rooms, { id: Date.now(), name: '', length: '', width: '' }]);
  };

  const removeRoom = (id: number) => {
    setRooms(rooms.filter(room => room.id !== id));
  };

  const updateRoom = (id: number, field: string, value: string) => {
    setRooms(rooms.map(room => room.id === id ? { ...room, [field]: value } : room));
  };

  const calculate = async () => {
    const netArea = rooms.reduce((sum, room) => sum + (parseFloat(room.length) || 0) * (parseFloat(room.width) || 0), 0);
    const wasteMultiplier = 1 + (parseFloat(wastePercentage) || 0) / 100;
    const wasteArea = netArea * wasteMultiplier;
    const materialCost = wasteArea * (parseFloat(prices.materialPrice) || 0);
    const installationCost = netArea * (parseFloat(prices.installationPrice) || 0);
    const totalCost = materialCost + installationCost + (parseFloat(prices.deliveryFee) || 0);

    setResults({ netArea, wasteArea, materialCost, installationCost, totalCost });

    // Increment usage counter
    try {
      const docRef = doc(db, 'stats', 'calculator');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, { usageCount: increment(1) });
      } else {
        await setDoc(docRef, { usageCount: 1 });
      }
    } catch (error) {
      console.error("Error updating usage count:", error);
    }
  };

  const resetCalculator = () => {
    setRooms([{ id: Date.now(), name: '', length: '', width: '' }]);
    setPrices({ materialPrice: '', installationPrice: '', deliveryFee: '' });
    setWastePercentage('10');
    setResults(null);
    setCopied(false);
  };

  const copyResults = () => {
    if (!results) return;
    const text = `📊 نتائج حساب تكلفة الأرضيات:
- المساحة الصافية: ${results.netArea.toFixed(2)} م²
- المساحة مع الهالك (${wastePercentage}%): ${results.wasteArea.toFixed(2)} م²
- تكلفة المواد: ${results.materialCost.toFixed(2)} ر.س
- تكلفة التركيب: ${results.installationCost.toFixed(2)} ر.س
- التكلفة الإجمالية: ${results.totalCost.toFixed(2)} ر.س

تم الحساب بواسطة حاسبة تكلفة الأرضيات - @salehapp`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 p-4 font-sans selection:bg-emerald-200 dark:selection:bg-emerald-900" dir="rtl">
        <div className="max-w-2xl mx-auto">
          <header className="flex justify-between items-center mb-8 mt-4">
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-emerald-700 dark:text-emerald-500">
                <Calculator className="w-8 h-8" />
                حاسبة تكلفة الأرضيات
              </h1>
              {usageCount !== null && (
                <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  <Users className="w-4 h-4" />
                  <span>تم استخدام الحاسبة {usageCount} مرة</span>
                </div>
              )}
            </div>
            <button onClick={() => setIsDark(!isDark)} className="p-3 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
            </button>
          </header>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {rooms.map((room, index) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  key={room.id} 
                  className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-lg text-slate-800 dark:text-slate-200">غرفة {index + 1}</h2>
                    {rooms.length > 1 && (
                      <button onClick={() => removeRoom(room.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-xl transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <input type="text" placeholder="اسم الغرفة (اختياري)" value={room.name} onChange={(e) => updateRoom(room.id, 'name', e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <input type="number" inputMode="decimal" placeholder="الطول" value={room.length} onChange={(e) => updateRoom(room.id, 'length', e.target.value)} className="w-full p-3 pl-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                        <span className="absolute left-3 top-3.5 text-slate-400 text-sm font-medium">متر</span>
                      </div>
                      <div className="relative">
                        <input type="number" inputMode="decimal" placeholder="العرض" value={room.width} onChange={(e) => updateRoom(room.id, 'width', e.target.value)} className="w-full p-3 pl-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                        <span className="absolute left-3 top-3.5 text-slate-400 text-sm font-medium">متر</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <button onClick={addRoom} className="w-full py-4 rounded-3xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 font-bold flex items-center justify-center gap-2 transition-colors border border-emerald-200 dark:border-emerald-800/50">
              <Plus className="w-6 h-6" /> إضافة غرفة أخرى
            </button>
          </div>

          <div className="mt-8 space-y-4 bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-200">الأسعار والإعدادات</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <input type="number" inputMode="decimal" placeholder="سعر المادة للمتر المربع" value={prices.materialPrice} onChange={(e) => setPrices({ ...prices, materialPrice: e.target.value })} className="w-full p-3 pl-12 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                <span className="absolute left-3 top-3.5 text-slate-400 text-sm font-medium">ر.س</span>
              </div>
              <div className="relative">
                <input type="number" inputMode="decimal" placeholder="سعر التركيب للمتر المربع" value={prices.installationPrice} onChange={(e) => setPrices({ ...prices, installationPrice: e.target.value })} className="w-full p-3 pl-12 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                <span className="absolute left-3 top-3.5 text-slate-400 text-sm font-medium">ر.س</span>
              </div>
              <div className="relative">
                <input type="number" inputMode="decimal" placeholder="رسوم التوصيل" value={prices.deliveryFee} onChange={(e) => setPrices({ ...prices, deliveryFee: e.target.value })} className="w-full p-3 pl-12 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                <span className="absolute left-3 top-3.5 text-slate-400 text-sm font-medium">ر.س</span>
              </div>
              <div className="relative">
                <input type="number" inputMode="decimal" placeholder="نسبة الهالك (الافتراضي 10%)" value={wastePercentage} onChange={(e) => setWastePercentage(e.target.value)} className="w-full p-3 pl-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                <span className="absolute left-3 top-3.5 text-slate-400 text-sm font-medium">%</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button onClick={calculate} className="flex-1 py-4 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xl transition-colors shadow-lg shadow-emerald-600/20">
              احسب التكلفة
            </button>
            <button onClick={resetCalculator} title="إعادة ضبط" className="px-6 py-4 rounded-3xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>

          <AnimatePresence>
            {results && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 space-y-4 relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-2xl text-slate-900 dark:text-white">النتائج النهائية</h3>
                  <button onClick={copyResults} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl font-medium">
                    {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'تم النسخ!' : 'نسخ النتائج'}
                  </button>
                </div>
                <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm sm:text-base">
                  <p className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span>المساحة الصافية:</span> 
                    <strong className="font-mono text-lg">{results.netArea.toFixed(2)} م²</strong>
                  </p>
                  <p className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span>المساحة مع الهالك ({wastePercentage}%):</span> 
                    <strong className="font-mono text-lg">{results.wasteArea.toFixed(2)} م²</strong>
                  </p>
                  <p className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span>تكلفة المواد:</span> 
                    <strong className="font-mono text-lg">{results.materialCost.toFixed(2)} <span className="text-sm text-slate-500">ر.س</span></strong>
                  </p>
                  <p className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span>تكلفة التركيب:</span> 
                    <strong className="font-mono text-lg">{results.installationCost.toFixed(2)} <span className="text-sm text-slate-500">ر.س</span></strong>
                  </p>
                  {parseFloat(prices.deliveryFee) > 0 && (
                    <p className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span>رسوم التوصيل:</span> 
                      <strong className="font-mono text-lg">{parseFloat(prices.deliveryFee).toFixed(2)} <span className="text-sm text-slate-500">ر.س</span></strong>
                    </p>
                  )}
                </div>
                <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                    <span className="font-bold text-xl text-emerald-900 dark:text-emerald-100">التكلفة الإجمالية:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-2xl font-mono">
                      {results.totalCost.toFixed(2)} <span className="text-lg">ر.س</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400 space-y-6 pb-8">
            <div className="flex flex-wrap justify-center gap-6">
              <button onClick={() => setActiveModal('howToUse')} className="hover:text-emerald-600 font-medium transition-colors">طريقة الاستخدام</button>
              <button onClick={() => setActiveModal('privacy')} className="hover:text-emerald-600 font-medium transition-colors">سياسة الخصوصية</button>
              <button onClick={() => setActiveModal('disclaimer')} className="hover:text-emerald-600 font-medium transition-colors">إخلاء مسؤولية</button>
            </div>
            <div className="flex flex-col items-center gap-3">
              <a href="https://t.me/salehapp" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 transition-colors">
                تواصل معنا على تلجرام <span dir="ltr" className="font-medium">@salehapp</span>
              </a>
              <p className="opacity-75">تم التطوير بواسطة صالح</p>
            </div>
          </footer>
        </div>

        <AnimatePresence>
          {activeModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" 
              dir="rtl"
              onClick={() => setActiveModal(null)}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-slate-100 dark:border-slate-800"
              >
                <button onClick={() => setActiveModal(null)} className="absolute top-4 left-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  {activeModal === 'howToUse' && 'طريقة الاستخدام'}
                  {activeModal === 'privacy' && 'سياسة الخصوصية'}
                  {activeModal === 'disclaimer' && 'إخلاء مسؤولية'}
                </h2>
                <div className="text-slate-600 dark:text-slate-300 space-y-4 leading-relaxed text-sm sm:text-base">
                  {activeModal === 'howToUse' && (
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 shrink-0" /> أدخل أبعاد كل غرفة (الطول والعرض بالمتر).</li>
                      <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 shrink-0" /> يمكنك إضافة أكثر من غرفة بالضغط على "إضافة غرفة أخرى".</li>
                      <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 shrink-0" /> أدخل سعر المتر المربع للمواد (مثل السيراميك، الباركيه).</li>
                      <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 shrink-0" /> أدخل سعر المتر المربع للتركيب (أجرة العامل).</li>
                      <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 shrink-0" /> حدد نسبة الهالك المناسبة (الافتراضي 10%).</li>
                      <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 shrink-0" /> اضغط على "احسب التكلفة" للحصول على إجمالي التكلفة.</li>
                    </ul>
                  )}
                  {activeModal === 'privacy' && (
                    <p className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      نحن نحترم خصوصيتك. هذا التطبيق لا يقوم بجمع أو تخزين أي بيانات شخصية خاصة بك. يتم فقط حساب عدد مرات استخدام الحاسبة بشكل عام ومجهول الهوية لتحسين الخدمة. جميع الحسابات تتم محلياً على جهازك.
                    </p>
                  )}
                  {activeModal === 'disclaimer' && (
                    <p className="bg-amber-50 dark:bg-amber-900/10 text-amber-900 dark:text-amber-200 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                      النتائج والتكاليف المحسوبة في هذا التطبيق هي تقديرية وتعتمد على الأرقام المدخلة ونسبة الهالك المحددة. قد تختلف التكلفة الفعلية بناءً على ظروف الموقع، نوع المواد، وتغير الأسعار في السوق. التطبيق والمطور غير مسؤولين عن أي قرارات مالية تُتخذ بناءً على هذه الحسابات.
                    </p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
