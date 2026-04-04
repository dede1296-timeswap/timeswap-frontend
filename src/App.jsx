import { useState, useEffect, useRef } from 'react'
import { getOffers, createOffer } from './firestore'
import stripePromise from './stripe'
import { auth } from './firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth'

export default function App() {
  const [page, setPage] = useState('home')
  const [modal, setModal] = useState(null)
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [currentOffer, setCurrentOffer] = useState(null)
  const [toast, setToast] = useState(null)
  const [chatMessages, setChatMessages] = useState([
    { from: 'them', text: 'Bonjour ! Je suis prêt(e) pour notre session.', time: '14:02' },
    { from: 'me', text: 'Bonjour Marie ! Oui parfait.', time: '14:02' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [timer, setTimer] = useState(0)
  const [dbOffers, setDbOffers] = useState([])
  const [loadingOffers, setLoadingOffers] = useState(true)
  const [rating, setRating] = useState(0)
  const [user, setUser] = useState(null)
  const timerRef = useRef(null)
  useEffect(() => {
  onAuthStateChanged(auth, (u) => setUser(u))
                  }, [])

  const offers = [
    { id:1, seller:'Marie L.', initials:'ML', title:'Coaching CV & LinkedIn', desc:'Optimisez votre profil LinkedIn et votre CV pour décrocher plus d\'entretiens.', cat:'Coaching', durations:[30,60], price:18, premium:true, rating:4.9, reviews:47 },
    { id:2, seller:'Tom B.', initials:'TB', title:'Session dessin créatif', desc:'Apprenez les bases du dessin numérique avec Procreate ou Photoshop.', cat:'Créatif', durations:[30,60], price:15, premium:false, rating:4.7, reviews:23 },
    { id:3, seller:'Sarah K.', initials:'SK', title:'Conversation anglais natif', desc:'Entraînez-vous à parler anglais avec une native speaker de NYC.', cat:'Services', durations:[15,30], price:12, premium:true, rating:5.0, reviews:61 },
    { id:4, seller:'Julien M.', initials:'JM', title:'Coaching confiance en soi', desc:'Techniques de PNL pour booster votre confiance.', cat:'Coaching', durations:[60], price:35, premium:true, rating:4.8, reviews:89 },
    { id:5, seller:'Lisa R.', initials:'LR', title:'Compagnie & discussion', desc:'Besoin d\'une oreille attentive ou d\'un échange enrichissant ?', cat:'Fun', durations:[15,30,60], price:8, premium:false, rating:4.6, reviews:12 },
    { id:6, seller:'Kevin D.', initials:'KD', title:'Montage vidéo express', desc:'Montage rapide de vos Reels, TikTok ou vidéos YouTube.', cat:'Services', durations:[30,60], price:20, premium:false, rating:4.5, reviews:34 },
  ]

  const sessions = [
    { offer:'Coaching CV & LinkedIn', date:'12 Jan 2025', duration:'60 min', price:'€30', status:'terminé', rating:5 },
    { offer:'Conversation anglais natif', date:'5 Jan 2025', duration:'30 min', price:'€12', status:'terminé', rating:4 },
    { offer:'Session dessin créatif', date:'28 Déc 2024', duration:'30 min', price:'€15', status:'annulé', rating:null },
  ]

  const badges = [
    { icon:'🌟', name:'Première session', earned:true },
    { icon:'🔥', name:'5 sessions', earned:true },
    { icon:'💎', name:'10 sessions', earned:true },
    { icon:'⭐', name:'Note 5 étoiles', earned:true },
    { icon:'🚀', name:'25 sessions', earned:false },
    { icon:'👑', name:'Top vendeur', earned:false },
  ]

  const faqs = [
    { q:'Comment fonctionne le paiement ?', a:'Le paiement est pré-autorisé via Stripe lors de la réservation. Il est libéré au vendeur uniquement à l\'issue de la session.' },
    { q:'Comment se déroule une session vidéo ?', a:'La session se déroule directement sur TimeSwap via WebRTC. Un lien Zoom de secours est généré si besoin.' },
    { q:'Puis-je annuler ma réservation ?', a:'Oui, jusqu\'à 24h avant la session vous êtes remboursé à 100%.' },
    { q:'Quelle est la commission de TimeSwap ?', a:'TimeSwap prélève 15% sur chaque transaction.' },
    { q:'Comment devenir vendeur Premium ?', a:'Cochez l\'option Premium lors de la création d\'une offre (+€2/session).' },
  ]

  const showToast = (msg, type='success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const goTo = (p) => { setPage(p); window.scrollTo(0,0) }

  const filteredOffers = (dbOffers.length > 0 ? dbOffers : offers).filter(o => {
    const matchCat = !category || o.cat === category
    const matchSearch = !search || o.title.toLowerCase().includes(search.toLowerCase()) || o.seller.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  useEffect(() => {
  async function loadOffers() {
    try {
      const data = await getOffers(category)
      setDbOffers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingOffers(false)
    }
  }
  loadOffers()
}, [category])

  useEffect(() => {
    if (page === 'session') {
      timerRef.current = setInterval(() => setTimer(t => t+1), 1000)
    } else {
      clearInterval(timerRef.current)
      setTimer(0)
    }
    return () => clearInterval(timerRef.current)
  }, [page])

  const formatTimer = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const sendChat = () => {
    if (!chatInput.trim()) return
    const now = new Date()
    setChatMessages(m => [...m, { from:'me', text:chatInput, time:`${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}` }])
    setChatInput('')
  }

  // ─── COMPOSANTS ───────────────────────────────────────────────

  const Nav = () => (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 px-6 h-16 flex items-center justify-between">
      <div className="font-black text-2xl text-indigo-600 cursor-pointer flex items-center gap-2" onClick={() => goTo('home')}>
        <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-sm">⏱</span> TimeSwap
      </div>
      <div className="flex items-center gap-1">
        {[['home','Accueil'],['offers','Offres'],['create','Créer offre'],['account','Mon compte'],['faq','FAQ']].map(([p,l]) => (
          <button key={p} onClick={() => goTo(p)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${page===p ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'}`}>
            {l}
          </button>
        ))}
      </div>
      <div className="flex gap-2 items-center">
  {user ? (
    <>
      <span className="text-sm text-gray-500">{user.email}</span>
      <button onClick={() => signOut(auth)} className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors">Déconnexion</button>
    </>
  ) : (
    <>
      <button onClick={() => setModal('login')} className="px-4 py-2 rounded-lg border-2 border-indigo-600 text-indigo-600 text-sm font-medium hover:bg-indigo-50 transition-colors">Connexion</button>
      <button onClick={() => setModal('signup')} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">S'inscrire</button>
    </>
  )}
</div>
    </nav>
  )

  const OfferCard = ({ o }) => (
    <div onClick={() => { setCurrentOffer(o); goTo('detail') }}
      className="bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200 transition-all">
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">{o.initials}</div>
        <div className="flex-1">
          <div className="text-sm font-medium">{o.seller}</div>
          <div className="text-yellow-400 text-xs">{'★'.repeat(Math.floor(o.rating))}</div>
        </div>
        {o.premium && <span className="bg-yellow-50 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">⭐ Premium</span>}
      </div>
      <div className="px-4 pb-4">
        <div className="font-bold text-sm mb-1">{o.title}</div>
        <div className="text-gray-500 text-xs mb-3 line-clamp-2">{o.desc}</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-indigo-600 font-bold text-lg">à partir de €{o.price}</div>
            <div className="text-gray-400 text-xs">{o.durations.map(d=>d+'min').join(' · ')}</div>
          </div>
          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">{o.cat}</span>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs text-gray-400">{o.reviews} avis · ★{o.rating}</span>
        <button className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">Réserver</button>
      </div>
    </div>
  )

  // ─── PAGES ────────────────────────────────────────────────────

  const HomePage = () => (
    <div>
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center bg-white/10 px-4 py-2 rounded-full text-sm mb-6">✦ La marketplace du temps — commission 15%</div>
          <h1 className="text-5xl font-black leading-tight mb-5">Achetez du temps.<br/>Vendez du <span className="text-yellow-400">talent.</span></h1>
          <p className="text-lg opacity-85 mb-8 max-w-lg">TimeSwap connecte vendeurs de talent et acheteurs de temps pour des sessions courtes, qualitatives et sécurisées.</p>
          <div className="flex gap-3">
            <button onClick={() => goTo('offers')} className="bg-yellow-400 text-gray-900 font-bold px-6 py-3 rounded-xl hover:bg-yellow-300 transition-colors">Découvrir les offres →</button>
            <button onClick={() => goTo('create')} className="bg-white/10 border border-white/25 text-white font-medium px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">Vendre mon temps</button>
          </div>
          <div className="flex gap-10 mt-12 pt-8 border-t border-white/20">
            {[['1 200+','Offres actives'],['4 800','Sessions réalisées'],['98%','Satisfaction'],['€0','Pour s\'inscrire']].map(([v,l]) => (
              <div key={l}><div className="text-2xl font-black">{v}</div><div className="text-sm opacity-70 mt-1">{l}</div></div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-14 px-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black">Explorez par catégorie</h2>
          <button onClick={() => goTo('offers')} className="text-indigo-600 border border-indigo-600 px-4 py-2 rounded-lg text-sm hover:bg-indigo-50 transition-colors">Tout voir</button>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-14">
          {[['🎯','Coaching','#EEF2FF','#3730A3',312],['🎉','Fun','#FFFBEB','#92400E',187],['🎨','Créatif','#D1FAE5','#065F46',254],['⚡','Services','#FEE2E2','#991B1B',447]].map(([icon,name,bg,color,count]) => (
            <div key={name} onClick={() => { setCategory(name); goTo('offers') }}
              className="rounded-xl p-5 text-center cursor-pointer hover:-translate-y-1 transition-transform"
              style={{ background: bg }}>
              <div className="text-3xl mb-3">{icon}</div>
              <div className="font-bold text-sm mb-1" style={{ color }}>{name}</div>
              <div className="text-xs opacity-70" style={{ color }}>{count} offres</div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black">Offres populaires</h2>
          <button onClick={() => goTo('offers')} className="text-indigo-600 border border-indigo-600 px-4 py-2 rounded-lg text-sm hover:bg-indigo-50 transition-colors">Toutes les offres</button>
        </div>
        <div className="grid grid-cols-3 gap-5 mb-14">
          {offers.slice(0,3).map(o => <OfferCard key={o.id} o={o} />)}
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-black mb-2">Comment ça marche ?</h2>
          <p className="text-gray-500">En 3 étapes simples</p>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {[['🔍','1. Recherchez','Parcourez les offres par catégorie, durée ou prix.'],['💳','2. Réservez','Payez en toute sécurité via Stripe. Votre argent est protégé.'],['🎬','3. Connectez','Rejoignez votre session vidéo. Le paiement est libéré à la fin.']].map(([icon,title,desc]) => (
            <div key={title} className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">{icon}</div>
              <h3 className="font-bold mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="bg-gray-900 text-white px-6 py-10 mt-10">
        <div className="max-w-5xl mx-auto grid grid-cols-4 gap-8 mb-8">
          <div>
            <div className="font-black text-lg mb-3">⏱ TimeSwap</div>
            <p className="text-gray-400 text-sm leading-relaxed">La marketplace du temps. Achetez du talent, vendez vos compétences.</p>
          </div>
          {[['Plateforme',['Offres','Créer une offre','Mon compte']],['Support',['FAQ','Contact','Status']],['Légal',['CGU','Confidentialité','Cookies']]].map(([title,links]) => (
            <div key={title}>
              <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">{title}</div>
              {links.map(l => <div key={l} onClick={() => l==='CGU'&&goTo('cgu')} className="text-gray-400 text-sm mb-2 cursor-pointer hover:text-white transition-colors">{l}</div>)}
            </div>
          ))}
        </div>
        <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-xs max-w-5xl mx-auto">
          © 2025 TimeSwap — Commission 15% · Paiements sécurisés Stripe
        </div>
      </footer>
    </div>
  )

  const OffersPage = () => (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-black mb-2">Toutes les offres</h1>
      <p className="text-gray-500 mb-6">1 200 offres disponibles</p>
      <div className="flex items-center bg-white border-2 border-gray-200 rounded-full px-5 py-2 gap-3 mb-5 shadow-sm">
        <input className="flex-1 outline-none text-sm bg-transparent" placeholder="Rechercher une compétence..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-medium">Rechercher</button>
      </div>
      <div className="flex gap-2 flex-wrap mb-6">
        {[['','Tout'],['Coaching','🎯 Coaching'],['Fun','🎉 Fun'],['Créatif','🎨 Créatif'],['Services','⚡ Services']].map(([val,label]) => (
          <button key={val} onClick={() => setCategory(val)}
            className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors ${category===val ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-gray-200 text-gray-500 hover:border-indigo-300'}`}>
            {label}
          </button>
        ))}
      </div>
      {filteredOffers.length === 0
        ? <p className="text-gray-400 text-center py-20">Aucune offre trouvée.</p>
        : <div className="grid grid-cols-3 gap-5">{filteredOffers.map(o => <OfferCard key={o.id} o={o} />)}</div>
      }
    </div>
  )

  const DetailPage = () => {
    if (!currentOffer) return null
    const o = currentOffer
    return (
      <div className="max-w-5xl mx-auto py-10 px-6">
        <button onClick={() => goTo('offers')} className="text-gray-500 text-sm mb-6 flex items-center gap-1 hover:text-indigo-600 transition-colors">← Retour aux offres</button>
        <div className="grid grid-cols-2 gap-8 items-start">
          <div>
            {o.premium && <span className="bg-yellow-50 text-yellow-800 text-xs px-3 py-1 rounded-full font-medium mb-3 inline-block">⭐ Offre Premium</span>}
            <h1 className="text-3xl font-black mb-4">{o.title}</h1>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">{o.initials}</div>
              <div>
                <div className="font-semibold">{o.seller}</div>
                <div className="text-yellow-400 text-sm">{'★'.repeat(Math.floor(o.rating))}</div>
              </div>
            </div>
            <p className="text-gray-500 leading-relaxed mb-6">{o.desc}</p>
            <div className="mb-6">
              <div className="text-sm font-semibold mb-3">Durées disponibles</div>
              <div className="flex gap-2 flex-wrap">
                {o.durations.map(d => (
                <span key={d} className="px-4 py-2 rounded-full border-2 border-indigo-600 text-indigo-600 text-sm font-medium">{d} min — €{o.prices ? o.prices[d] : Math.round(o.price*(d/30))}</span>
                  ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm">
              <div className="font-semibold mb-3">FAQ rapide</div>
              <div className="text-gray-500 space-y-2 leading-relaxed">
                <p><strong>Comment se déroule la session ?</strong> En vidéo via notre plateforme ou Zoom.</p>
                <p><strong>Et si je veux annuler ?</strong> Remboursement complet si annulation 24h avant.</p>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-800 text-sm">✓ Paiement sécurisé Stripe · Remboursement garanti si session non réalisée</div>
          </div>
          <div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-24">
              <div className="text-gray-400 text-sm mb-1">Prix à partir de</div>
              <div className="text-4xl font-black text-indigo-600 mb-5">€{o.price}</div>
              <div className="mb-4">
                <label className="text-sm font-medium block mb-1">Choisir la durée</label>
                <select className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none">
                  {o.durations.map(d => <option key={d}>{d} minutes</option>)}
                </select>
              </div>
              <div className="mb-5">
                <label className="text-sm font-medium block mb-1">Choisir une date</label>
                <input type="date" className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none" />
              </div>
              <button onClick={() => setModal('booking')} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors">Réserver maintenant</button>
              <p className="text-center text-xs text-gray-400 mt-3">Aucun frais caché · Paiement sécurisé</p>
              <div className="border-t border-gray-100 mt-4 pt-4 text-sm text-gray-400">★ {o.rating} · {o.reviews} avis</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const CreatePage = () => {
    const [notif, setNotif] = useState(null)
    const [form, setForm] = useState({ title:'', desc:'', cat:'', premium:false })
    const submit = async () => {
      if (!form.title || !form.desc || !form.cat) {
        setNotif({ type:'error', msg:'Veuillez compléter tous les champs obligatoires.' })
        return
      }
      try {
        const durations = [
  ...(form.dur15 ? [15] : []),
  ...(form.dur30 ? [30] : []),
  ...(form.dur60 ? [60] : []),
]
const prices = {}
if (form.dur15 && form.price15) prices[15] = Number(form.price15)
if (form.dur30 && form.price30) prices[30] = Number(form.price30)
if (form.dur60 && form.price60) prices[60] = Number(form.price60)
const minPrice = Math.min(...Object.values(prices))

await createOffer({
  title: form.title,
  desc: form.desc,
  cat: form.cat,
  premium: form.premium,
  seller: 'Moi',
  initials: 'MO',
  durations,
  price: minPrice,
  prices,
  rating: 0,
  reviews: 0,
})
        setNotif({ type:'success', msg:'✓ Votre offre est en ligne !' })
        setTimeout(() => goTo('offers'), 2000)
      } catch (err) {
        setNotif({ type:'error', msg:'Erreur lors de la publication.' })
      }
    }
    return (
      <div className="max-w-xl mx-auto py-10 px-6">
        <h1 className="text-3xl font-black mb-2">Créer une offre</h1>
        <p className="text-gray-500 mb-8">Partagez votre talent et monétisez votre temps</p>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          {notif && <div className={`p-3 rounded-lg mb-5 text-sm font-medium ${notif.type==='success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>{notif.msg}</div>}
          {[['Titre','text','title','Ex: Coaching motivation personnelle'],['Description','textarea','desc','Décrivez ce que vous offrez...']].map(([label,type,key,placeholder]) => (
            <div key={key} className="mb-4">
              <label className="text-sm font-medium block mb-1">{label} *</label>
              {type==='textarea'
                ? <textarea className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none min-h-24 resize-y" placeholder={placeholder} value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})} />
                : <input type="text" className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none" placeholder={placeholder} value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})} />
              }
            </div>
          ))}
          <div className="mb-4">
            <label className="text-sm font-medium block mb-1">Catégorie *</label>
            <select className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none" value={form.cat} onChange={e => setForm({...form,cat:e.target.value})}>
              <option value="">Choisir une catégorie</option>
              {['Coaching','Fun','Créatif','Services'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium block mb-2">Durées disponibles *</label>
            {[15,30,60].map(d => (
              <div key={d} className="flex items-center gap-2 mb-2">
                <input type="checkbox" id={`dur${d}`} className="w-4 h-4"
                  checked={form[`dur${d}`]}
                  onChange={e => setForm({...form, [`dur${d}`]: e.target.checked})} />
                <label htmlFor={`dur${d}`} className="text-sm">{d} minutes</label>
              </div>
            ))}
          </div>
          <div className="mb-5">
            <label className="text-sm font-medium block mb-2">Prix par durée (€)</label>
            <div className="grid grid-cols-3 gap-3">
              {[['15 min','price15','dur15'],['30 min','price30','dur30'],['60 min','price60','dur60']].map(([label, priceKey, durKey]) => (
                <div key={priceKey}>
                  <label className="text-xs text-gray-500 block mb-1">{label}</label>
                  <input type="number"
                    className={`w-full border-2 rounded-lg p-2 text-sm outline-none ${form[durKey] ? 'border-indigo-500 focus:border-indigo-600' : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'}`}
                    placeholder="€" min="0"
                    disabled={!form[durKey]}
                    value={form[priceKey]}
                    onChange={e => setForm({...form, [priceKey]: e.target.value})} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5">
            <input type="checkbox" id="premium" className="w-4 h-4 mt-0.5" checked={form.premium} onChange={e => setForm({...form,premium:e.target.checked})} />
            <div>
              <label htmlFor="premium" className="text-sm font-semibold cursor-pointer">⭐ Option Premium (+€2/session)</label>
              <p className="text-xs text-gray-500 mt-1">Badge visible, priorité dans les résultats</p>
            </div>
          </div>
          <button onClick={submit} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors">Publier l'offre</button>
        </div>
      </div>
    )
  }

  const AccountPage = () => (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-2xl">AD</div>
        <div>
          <h1 className="text-2xl font-black">Alex Dupont</h1>
          <p className="text-gray-400 text-sm">alex.dupont@email.com · Membre depuis Jan 2025</p>
          <div className="flex gap-2 mt-2">
            <span className="bg-green-50 text-green-800 text-xs px-2 py-1 rounded-full font-medium">✓ Vérifié</span>
            <span className="bg-yellow-50 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">⭐ Premium</span>
          </div>
        </div>
      </div>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
        {[['dashboard','Dashboard'],['sessions','Sessions'],['wallet','Portefeuille'],['badges','Badges'],['settings','Paramètres']].map(([id,label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab===id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab==='dashboard' && (
        <div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[['€347','Revenus ce mois','text-indigo-600'],['24','Sessions réalisées','text-green-600'],['4.8','Note moyenne','text-yellow-500'],['2','Réservations en attente','text-red-500']].map(([v,l,c]) => (
              <div key={l} className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
                <div className={`text-3xl font-black ${c}`}>{v}</div>
                <div className="text-xs text-gray-400 mt-1">{l}</div>
              </div>
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="font-bold mb-4">Prochaines sessions</div>
            {[['Coaching CV & LinkedIn avec Marie L.','Demain · 14h00 · 60 min','€30'],['Session dessin créatif avec Tom B.','Jeudi · 18h30 · 30 min','€18']].map(([title,meta,price]) => (
              <div key={title} className="flex gap-4 py-3 border-b border-gray-100 last:border-0">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-sm">{title}</div>
                  <div className="text-xs text-gray-400 mt-1">{meta} · <strong className="text-indigo-600">{price}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab==='sessions' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          {sessions.map((s,i) => (
            <div key={i} className="flex gap-4 py-3 border-b border-gray-100 last:border-0 items-start">
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${s.status==='terminé' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div className="font-medium text-sm">{s.offer}</div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.status==='terminé' ? 'bg-green-50 text-green-800' : 'bg-gray-100 text-gray-500'}`}>{s.status}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">{s.date} · {s.duration} · <strong className="text-indigo-600">{s.price}</strong></div>
                {s.rating && <div className="text-yellow-400 text-xs mt-1">{'★'.repeat(s.rating)}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab==='wallet' && (
        <div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="text-sm text-gray-400 mb-2">Solde disponible</div>
              <div className="text-4xl font-black text-indigo-600">€124.50</div>
              <button className="mt-4 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">Retirer vers mon compte</button>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="text-sm text-gray-400 mb-2">Revenus totaux</div>
              <div className="text-4xl font-black text-green-600">€1 247</div>
              <div className="text-xs text-gray-400 mt-2">Après commission TimeSwap (15%)</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="font-bold mb-4">Historique</div>
            {[['Session coaching avec M. Leblanc','12 Jan 2025','+€25.50','text-green-600'],['Commission TimeSwap (15%)','12 Jan 2025','-€4.50','text-red-500'],['Session dessin avec T. Martin','8 Jan 2025','+€15.30','text-green-600'],['Virement bancaire','5 Jan 2025','-€100.00','text-gray-500']].map(([desc,date,amount,color]) => (
              <div key={desc} className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0 text-sm">
                <div><div className="font-medium">{desc}</div><div className="text-xs text-gray-400 mt-0.5">{date}</div></div>
                <div className={`font-bold ${color}`}>{amount}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab==='badges' && (
        <div>
          <p className="text-gray-500 text-sm mb-5">Déverrouillez des badges en réalisant des sessions.</p>
          <div className="grid grid-cols-6 gap-3">
            {badges.map((b,i) => (
              <div key={i} className={`text-center p-4 rounded-xl border-2 transition-colors ${b.earned ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'}`}>
                <div className="text-3xl mb-2">{b.icon}</div>
                <div className={`text-xs font-bold ${b.earned ? 'text-yellow-800' : 'text-gray-400'}`}>{b.name}</div>
                <div className={`text-xs mt-1 ${b.earned ? 'text-yellow-600' : 'text-gray-300'}`}>{b.earned ? 'Obtenu' : '🔒'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab==='settings' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm max-w-md">
          <h3 className="font-bold mb-5">Informations personnelles</h3>
          {[['Nom complet','text','Alex Dupont'],['Email','email','alex.dupont@email.com'],['Nouveau mot de passe','password','']].map(([label,type,val]) => (
            <div key={label} className="mb-4">
              <label className="text-sm font-medium block mb-1">{label}</label>
              <input type={type} defaultValue={val} placeholder={type==='password'?'Laisser vide pour ne pas changer':''} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none" />
            </div>
          ))}
          <button onClick={() => showToast('Profil mis à jour !')} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors">Sauvegarder</button>
        </div>
      )}
    </div>
  )

  const SessionPage = () => (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black">Session en cours</h1>
        <span className="bg-green-50 text-green-800 text-sm px-4 py-1.5 rounded-full font-medium">● En direct</span>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <div className="bg-gray-800 rounded-xl overflow-hidden mb-4">
            <div className="h-52 flex flex-col items-center justify-center gap-2 text-gray-400">
              <span className="text-4xl">📷</span>
              <span className="text-sm">Caméra du vendeur</span>
            </div>
            <div className="p-3 flex justify-center gap-3">
              {[['🎤','gray'],['📹','gray'],['📞','red'],['🖥️','green']].map(([icon,color],i) => (
                <button key={i} onClick={() => color==='red'&&setModal('rating')}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${color==='red'?'bg-red-500':color==='green'?'bg-green-500':'bg-white/20'}`}>{icon}</button>
              ))}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm">
            <div className="text-xs text-gray-400 mb-1">Durée de session</div>
            <div className="text-5xl font-black text-indigo-600">{formatTimer(timer)}</div>
            <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width:`${Math.min((timer/1800)*100,100)}%` }}></div>
            </div>
            <div className="text-xs text-gray-400 mt-2">{Math.floor(timer/60)} / 30 min</div>
          </div>
        </div>
        <div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4">
            <div className="font-bold mb-3 text-sm">Chat de session</div>
            <div className="h-64 overflow-y-auto flex flex-col gap-2.5 bg-gray-50 rounded-lg p-3 mb-3">
              {chatMessages.map((m,i) => (
                <div key={i} className={`max-w-xs px-3 py-2 rounded-xl text-sm ${m.from==='me' ? 'bg-indigo-600 text-white self-end rounded-br-sm' : 'bg-white border border-gray-200 self-start rounded-bl-sm'}`}>
                  {m.text}
                  <div className={`text-xs mt-1 opacity-60`}>{m.time}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="flex-1 border-2 border-gray-200 rounded-full px-4 py-2 text-sm focus:border-indigo-500 outline-none" placeholder="Écrire un message..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key==='Enter'&&sendChat()} />
              <button onClick={sendChat} className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">→</button>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-sm">
            <div className="font-bold mb-3">Infos session</div>
            {[['Vendeur','Marie Laurent'],['Durée','30 minutes'],['Prix','€18'],['Statut paiement','Pré-autorisé']].map(([k,v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-400">{k}</span>
                <span className={`font-medium ${k==='Prix'?'text-indigo-600':k==='Statut paiement'?'text-yellow-600':''}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const FaqPage = () => {
    const [open, setOpen] = useState(null)
    return (
      <div className="max-w-2xl mx-auto py-10 px-6">
        <h1 className="text-3xl font-black mb-2">FAQ</h1>
        <p className="text-gray-500 mb-8">Trouvez les réponses à vos questions</p>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-6">
          {faqs.map((f,i) => (
            <div key={i} className="border-b border-gray-100 last:border-0">
              <button onClick={() => setOpen(open===i?null:i)} className="w-full flex justify-between items-center px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                <span className="font-semibold text-sm">{f.q}</span>
                <span className={`text-gray-400 text-lg transition-transform ${open===i?'rotate-45':''}`}>+</span>
              </button>
              {open===i && <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">{f.a}</div>}
            </div>
          ))}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
          <div className="text-2xl mb-2">🤝</div>
          <h3 className="font-bold mb-2">Besoin d'aide ?</h3>
          <p className="text-gray-500 text-sm mb-4">Notre équipe support répond sous 24h</p>
          <button className="bg-indigo-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors">Contacter le support</button>
        </div>
      </div>
    )
  }

  const CguPage = () => (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-black mb-2">CGU</h1>
      <p className="text-gray-400 text-sm mb-8">Dernière mise à jour : 1er janvier 2025</p>
      <div className="space-y-4">
        {[['1. Objet','TimeSwap est une marketplace permettant de vendre et acheter du temps sous forme de sessions courtes. TimeSwap perçoit une commission de 15% sur chaque transaction.'],['2. Offres interdites','Sont strictement interdites toutes les offres à caractère illégal, discriminatoire ou contraire aux lois françaises. TimeSwap se réserve le droit de supprimer toute offre non conforme.'],['3. Paiements','Les paiements sont traités via Stripe. Le paiement est pré-autorisé à la réservation et libéré au vendeur après la session. Remboursement complet si annulation 24h avant.'],['4. Responsabilité','TimeSwap agit en tant qu\'intermédiaire technique. La qualité des sessions incombe aux vendeurs.']].map(([title,text]) => (
          <div key={title} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold mb-2">{title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </div>
  )

  // ─── MODAUX ───────────────────────────────────────────────────

  const Modal = ({ id, title, children }) => modal!==id ? null : (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target===e.currentTarget&&setModal(null)}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto relative">
        <button onClick={() => setModal(null)} className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        <h2 className="text-2xl font-black mb-6">{title}</h2>
        {children}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Nav />

      {page==='home' && <HomePage />}
      {page==='offers' && <OffersPage />}
      {page==='detail' && <DetailPage />}
      {page==='create' && <CreatePage />}
      {page==='account' && <AccountPage />}
      {page==='session' && <SessionPage />}
      {page==='faq' && <FaqPage />}
      {page==='cgu' && <CguPage />}

      <Modal id="login" title="Connexion">
  <div className="space-y-4">
    <div><label className="text-sm font-medium block mb-1">Email</label><input id="login-email" type="email" placeholder="votre@email.com" className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none" /></div>
    <div><label className="text-sm font-medium block mb-1">Mot de passe</label><input id="login-password" type="password" placeholder="••••••••" className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none" /></div>
    <button onClick={async () => {
      const email = document.getElementById('login-email').value
      const password = document.getElementById('login-password').value
      try {
        await signInWithEmailAndPassword(auth, email, password)
        setModal(null)
        showToast('Bienvenue sur TimeSwap !')
      } catch (err) {
        showToast('Email ou mot de passe incorrect.', 'error')
      }
    }} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors">Se connecter</button>
    <p className="text-center text-sm text-gray-500">Pas de compte ? <span className="text-indigo-600 cursor-pointer" onClick={() => setModal('signup')}>S'inscrire</span></p>
  </div>
</Modal>

      <Modal id="signup" title="Créer un compte">
  <div className="space-y-4">
    <div><label className="text-sm font-medium block mb-1">Nom complet</label><input type="text" placeholder="Marie Dupont" className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none" /></div>
    <div><label className="text-sm font-medium block mb-1">Email</label><input id="signup-email" type="email" placeholder="votre@email.com" className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none" /></div>
    <div><label className="text-sm font-medium block mb-1">Mot de passe</label><input id="signup-password" type="password" placeholder="••••••••" className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none" /></div>
    <div><label className="text-sm font-medium block mb-1">Je suis un...</label>
      <select className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none">
        <option>Acheteur</option><option>Vendeur</option><option>Les deux</option>
      </select>
    </div>
    <button onClick={async () => {
      const email = document.getElementById('signup-email').value
      const password = document.getElementById('signup-password').value
      try {
        await createUserWithEmailAndPassword(auth, email, password)
        setModal(null)
        showToast('Compte créé ! Bienvenue sur TimeSwap.')
      } catch (err) {
        showToast('Erreur : ' + err.message, 'error')
      }
    }} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors">Créer mon compte</button>
    <p className="text-center text-xs text-gray-400">En vous inscrivant, vous acceptez nos <span className="text-indigo-600 cursor-pointer" onClick={() => { setModal(null); goTo('cgu') }}>CGU</span></p>
  </div>
</Modal>

      <Modal id="booking" title="Confirmer la réservation">
        <div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-indigo-800 text-sm mb-5">Session avec <strong>{currentOffer?.seller}</strong></div>
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <span className="font-black text-indigo-600">stripe</span>
              <span className="bg-green-50 text-green-800 text-xs px-2 py-1 rounded-full">✓ Sécurisé SSL</span>
            </div>
            <div className="font-mono text-lg tracking-widest mb-3">4242 4242 4242 4242</div>
            <div className="grid grid-cols-3 gap-2">
              {[['Expiration','12/27'],['CVC','123'],['CP','75001']].map(([label,ph]) => (
                <div key={label}><div className="text-xs text-gray-400 mb-1">{label}</div><input type="text" defaultValue={ph} className="w-full border-2 border-gray-200 rounded-lg p-2 text-sm focus:border-indigo-500 outline-none" /></div>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm space-y-2">
            {[['Durée','30 min'],['Prix session',`€${currentOffer?.price||18}`],['Commission (15%)',`€${((currentOffer?.price||18)*0.15).toFixed(2)}`]].map(([k,v]) => (
              <div key={k} className="flex justify-between py-1 border-b border-gray-200 last:border-0"><span className="text-gray-500">{k}</span><span>{v}</span></div>
            ))}
            <div className="flex justify-between pt-1 font-bold text-base"><span>Total</span><span className="text-indigo-600">€{((currentOffer?.price||18)*1.15).toFixed(2)}</span></div>
          </div>
<button onClick={async () => {
  const stripe = await stripePromise
  showToast('⏳ Traitement du paiement...')
  setTimeout(() => {
    setModal(null)
    showToast('✓ Session réservée ! Le lien vous sera envoyé 10 min avant.')
  }, 2000)
}} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors">Confirmer et payer</button>          <p className="text-center text-xs text-gray-400 mt-3">Pré-autorisation uniquement · Libéré après la session</p>
        </div>
      </Modal>

      <Modal id="rating" title="Session terminée !">
        <div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm mb-6">✓ L'argent a été versé au vendeur.</div>
          <p className="text-sm text-gray-500 text-center mb-4">Comment évalueriez-vous cette session ?</p>
          <div className="flex justify-center gap-3 text-4xl mb-6">
            {[1,2,3,4,5].map(n => (
              <span key={n} onClick={() => setRating(n)} className="cursor-pointer transition-transform hover:scale-110" style={{ color: n<=rating?'#FBBF24':'#D1D5DB' }}>★</span>
            ))}
          </div>
          <div className="mb-5"><label className="text-sm font-medium block mb-1">Votre commentaire</label><textarea className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none min-h-20 resize-none" placeholder="Partagez votre expérience..." /></div>
          <button onClick={() => { setModal(null); showToast('Merci pour votre avis !') }} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors">Envoyer mon avis</button>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm">
          <div className={`px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium border ${toast.type==='success'?'bg-green-50 text-green-800 border-green-200':'bg-red-50 text-red-800 border-red-200'}`}>
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  )
}
