// ============================================================
//  DÜZENLENECEK TEK DOSYA
//  Konu, mesaj ve alıcılar aşağıda. Değiştirip commit'le, bitti.
//  Şablonda {isim}, {sirket} gibi değişkenler kullanabilirsin —
//  her alıcı için otomatik doldurulur.
// ============================================================

const CAMPAIGN = {
  title: "Kampanya Adı",              // Sayfada büyük başlık olarak görünür
  description: "Aşağıdaki butona bastığınızda her alıcı için Gmail'de ayrı bir taslak açılır. Sizden sadece 'Gönder'e basmanız gerekir.",

  subject: "Merhaba {isim}",

  body:
`Sayın {isim},

{sirket} ekibine kısa bir ricam var.
[...mesajın gövdesi burada...]

Saygılarımla,
Ad Soyad`,

  recipients: [
    { email: "ali@ornek.com",  isim: "Ali",   sirket: "Acme"   },
    { email: "ayse@ornek.com", isim: "Ayşe",  sirket: "Globex" },
    { email: "mehmet@ornek.com", isim: "Mehmet", sirket: "Initech" }
  ]
};
