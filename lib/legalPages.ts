/**
 * Yasal sayfa içerikleri — tüm firma adı ve domain referansları
 * yer tutucu [ŞİRKET ADI] / [ALAN ADI] ile değiştirilmiştir.
 * Yayın öncesi yetkili avukat/hukuk birimi tarafından güncellenmesi gerekir.
 */
export interface LegalPage {
  title: string
  content: string
}

export const LEGAL_PAGES: Record<string, LegalPage> = {
  "uyelik-ve-kullanim-sozlesmesi": {
    title: "Üyelik ve Kullanım Sözleşmesi",
    content: `1. Taraflar

İşbu Üyelik ve Kullanım Sözleşmesi (kısaca "Sözleşme") [ALAN ADI] uzantılı web sitesinin, aplikasyonunun ve buna bağlı tüm uygulamaların (kısaca "Site") tüm haklarının sahibi olan [ŞİRKET ADI] (kısaca "Satıcı") ile kimlik ve iletişim bilgilerini işbu sözleşmenin kabulü öncesinde sisteme tanımlamış olan Üye arasındadır. Üye, Site'ye üye olarak, işbu 'Sözleşme'nin tamamını okuduğunu, anladığını ve tüm hükümlerini onayladığını kabul, beyan ve taahhüt eder.

2. Sözleşmenin Konusu

İşbu Sözleşme'nin konusu Satıcı'nın sahibi olduğu platform üzerinden çeşitli iletişim ve reklam platformlarının dahil olduğu geniş kapsamlı ürün ve hizmetler sunan [ALAN ADI] uzantılı web sitesinin kullanım koşullarının ve tarafların karşılıklı hak ve yükümlülüklerinin belirlenmesidir.

3. Satıcı'nın Hakları

A) Satıcı güvenlik nedeniyle Üye'nin site üzerindeki her türlü aktivitesini izleyebilir, kayda alabilir ve/veya gerekli gördüğünde, Site'den uzaklaştırma, üyelik dondurma, üyelik iptal etme ve benzeri her türlü müdahalede bulunabilir.
B) Satıcı, önceden Üye'ye bildirimde bulunmaksızın Site'nin biçim ve içeriğini kısmen ve/veya tamamen değiştirebileceği gibi, Site'nin yayın yaptığı alan adını değiştirebilir, farklı alt alan adları kullanabilir, alan adı yönlendirmesi yapabilir ve/veya alan adını kapatabilir.
C) Satıcı, dilediği zamanda ve/veya sebep göstermeksizin, önceden Üye'ye bilgi vermeksizin Site'de sunduğu hizmetlerin kapsam ve/veya çeşitlerini değiştirebileceği gibi, Site'de sunulan hizmetleri kısmen veya tamamen dondurabilir, sona erdirebilir veya tamamen iptal edebilir.
D) Satıcı sözleşmede belirtilen iş ve/veya işlemlerin daha etkin gerçekleştirilebilmesi açısından dilediği zaman hizmet, satış şartları ve/veya işleyişte değişiklikler ve/veya güncellemeler yapabilir. Üyeler işbu değişiklikleri kabul ettiklerini, bu değişikliklere uygun davranacaklarını şimdiden kabul ve beyan ederler.
E) İşbu sözleşme Satıcı'nın ürün satışı için herhangi bir taahhüt içermez. Üye, bu ve sair nedenlerle Satıcı'dan hiçbir ad altında hak ve alacak talep edemez.
F) Satıcı'nın üyeliği tek taraflı olarak durdurma, sona erdirme ve/veya iptal etme hakkı mevcuttur. Üye bu hususta herhangi bir itiraz hakkının mevcut olmadığını kabul, beyan ve taahhüt eder.
G) Satıcı kullanıcı profili ve pazar araştırmaları yapmak, satış ve site kullanım istatistikleri oluşturmak gibi amaçlar dahil ancak bunlarla sınırlı olmamak üzere tüm yasal amaçlar için, Üye'nin kimlik, adres, iletişim ve site kullanım bilgilerini bir veri tabanında toplayabilir ve bu bilgileri herhangi bir kısıtlama olmaksızın işleyebilir.
H) Satıcı, ilave hizmetler açabilir, bazı hizmetlerini kısmen veya tamamen değiştirebilir veya ücretli hale dönüştürebilir. Bu durumda kullanıcının Sözleşme'yi feshederek, üyelikten ayrılma hakkı saklıdır.
I) Satıcı, ileride doğacak teknik zaruretler ve mevzuata uyum amacıyla kullanıcıların aleyhine olmamak kaydıyla işbu Sözleşme'nin uygulamasında değişiklikler yapabilir, mevcut maddelerini değiştirebilir veya yeni maddeler ilave edebilir.

4. Üye'nin Yükümlülükleri

A) Üyelik, sitede belirtilen üyelik prosedürünün üye olmak isteyen kişi tarafından yerine getirilerek kayıt işleminin yapılması ile tamamlanır.
B) Üye, üyelik işlemlerinde belirtmiş olduğu kimlik, adres ve/veya iletişim bilgilerinin eksiksiz ve doğru olduğunu kabul ve beyan eder.
C) Üye, Site'yi kullanırken başkaları tarafından kolay tahmin edilemeyecek bir şifre kullanacağını kabul ve beyan eder.
D) Üye, Sitede yer alan forum ve blogların kullanımı esnasında yasal mevzuata uygun davranacağını kabul eder.
E) Üye, hileli davranışlarda bulunmayacağını, Site'nin güvenlik mekanizmasına müdahale etmeyeceğini kabul ve taahhüt eder.
F) Üye, sadece kendisine ait üyelik hesabını kullanacağını kabul eder.
G) Üye, üyelik hesabını üçüncü kişilere devredemez.
H) Üye, başkalarının Site'yi kullanımını kısıtlayamaz ve Site'nin işletimine müdahale edemez.
I) Satıcı, bilgisayar donanımını etkileyen virüs saldırılarından ve/veya siteden edinilen bilgiler sebebiyle oluşabilecek zararlardan sorumlu değildir.

5. Kampanyalar
Kampanya ve avantajlara katılım, Satıcı tarafından belirlenen tarih, belli kontenjan, stok ve sınırlamaları ile diğer kısıtlamalara tabi olabilir.

6. Kişisel Verilerin Gizliliği
Satıcı, Üye'lerin kişisel verilerini ilgili mevzuat çerçevesinde işler.

7. Fikri Mülkiyet Hakları
Site'nin sunumu ve tüm içeriği T.C. Mevzuatı ve fikri mülkiyet mevzuatı tarafından korunmaktadır.

8. Sorumluluk
Satıcı hizmetin hatasız olacağını veya sürekli sağlanacağını garanti etmemektedir.

9. Üyelik İptali ve Sözleşmenin Feshi
Üye'nin işbu sözleşmeden kaynaklanan yükümlülüklerine aykırı davranması durumunda Satıcı, üyeliği iptal edebilir.

10. Sözleşmenin Süresi
İşbu sözleşme Site'de onaylandığı andan itibaren yürürlüğe girer ve üyeliğin iptal edilmesi ile sona erer.

11. Muhtelif Hükümler
İşbu Sözleşme'den doğan uyuşmazlıkların çözümü hususunda İstanbul Mahkemeleri ile İcra Daireleri yetkilendirilmiştir.
`
  },
  "iade-proseduru": {
    title: "İade Prosedürü",
    content: `Kredi kartı taksidiyle alınan ürünlerin tutar iadesinde; Alışveriş kredi kartı ile ve taksitli olarak yapılmışsa, Alıcı ürünü kaç taksit ile aldıysa Banka Alıcı'ya geri ödemesini taksitle yapmaktadır. Satıcı bankaya ürün bedelinin tamamını tek seferde ödedikten sonra, Banka poslarından yapılan taksitli harcamaların Alıcı'nın kredi kartına iadesi durumunda, konuya müdahil tarafların mağdur duruma düşmemesi için talep edilen iade tutarları, yine taksitli olarak hamil taraf hesaplarına Banka tarafından aktarılır. Alıcı'nın satış iptaline kadar ödemiş olduğu taksit tutarları, eğer iade tarihi ile kartın hesap kesim tarihleri çakışmazsa her ay karta 1 (bir) iade yansıyacak ve Alıcı iade öncesinde ödemiş olduğu taksitleri satışın taksitleri bittikten sonra, iade öncesinde ödemiş olduğu taksitleri sayısı kadar ay daha alacak ve mevcut borçlarından düşmüş olacaktır.

Kart ile alınmış mal ve hizmetin iadesi durumunda Satıcı, Banka ile yapmış olduğu sözleşme gereği Alıcı'ya nakit para ile ödeme yapamaz. Satıcı, bir iade işlemi söz konusu olduğunda ilgili yazılım aracılığı ile iadesini yapacak olup, Satıcı ilgili tutarı Banka'ya nakden veya mahsuben ödemekle yükümlü olduğundan yukarıda anlatmış olduğumuz prosedür gereğince Alıcı'ya nakit olarak ödeme yapılamamaktadır.

Havale/EFT yoluyla alınmış mal ve hizmetin iadesi durumunda SATICI, Banka ile yapmış olduğu sözleşme gereği Alıcı'ya nakit para ile ödeme yapamaz. Detaylı bilgi için müşteri hizmetleri ile iletişime geçiniz.

Alıcı, bu prosedürü okuduğunu ve kabul ettiğini kabul ve taahhüt eder.`
  },
  "cayma-hakki": {
    title: "Cayma Hakkı",
    content: `Alıcı, Ürünlerin kendisine veya gösterdiği adresteki kişi/kuruluşa teslim tarihinden itibaren 14 (ondört) gün içerisinde hiçbir hukuki ve cezai sorumluluk üstlenmeksizin ve hiçbir gerekçe göstermeksizin Ürünleri reddederek cayma hakkını kullanabilir. Cayma hakkının kullanımından kaynaklanan masraflar Satıcı'ya aittir.

Cayma hakkı süresinin belirlenmesinde;
a) Tek sipariş konusu olup ayrı ayrı teslim edilen mallarda, Alıcı'nın veya Alıcı tarafından belirlenen üçüncü kişinin son malı teslim aldığı gün,
b) Birden fazla parçadan oluşan mallarda, Alıcı'nın veya Alıcı tarafından belirlenen üçüncü kişinin son parçayı teslim aldığı gün,
c) Belirli bir süre boyunca malın düzenli tesliminin yapıldığı sözleşmelerde, Alıcı'nın veya Alıcı tarafından belirlenen üçüncü kişinin ilk malı teslim aldığı gün esas alınır.

Cayma hakkı süresi, hizmet ifasına ilişkin sözleşmelerde sözleşmenin kurulduğu gün; mal teslimine ilişkin sözleşmelerde ise Alıcı'nın veya Alıcı tarafından belirlenen üçüncü kişinin malı teslim aldığı gün başlar. Ancak Alıcı, sözleşmenin kurulmasından malın teslimine kadar olan süre içinde de cayma hakkını kullanabilir.

Cayma hakkının kullanıldığına dair bildirimin, 14 (ondört) günlük süre içinde Satıcı'ya yazılı olarak yapılması ve Ürünün kullanılmamış olması gerekir.

Bu hakkın kullanılması halinde,
Alıcı'ya teslim edilen ürünün faturası (Kurumsal ise iade faturası),
İade formu,
İade edilecek ürünlerin kutusu, ambalajı, varsa standart aksesuarları ile birlikte eksiksiz ve hasarsız olarak teslim edilmesi gerekmektedir.

CAYMA HAKKI KULLANILAMAYACAK ÜRÜNLER
Aşağıda sayılan ürünlerde cayma hakkı kullanılamaz:
- Fiyatı finansal piyasalardaki dalgalanmalara bağlı olarak değişen ürün veya hizmetler
- Tüketicinin istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan ürünler
- Çabuk bozulabilen veya son kullanma tarihi geçebilecek ürünler
- Sağlık veya hijyen açısından iadesi uygun olmayıp, tesliminden sonra ambalajı açılmış ürünler (iç giyim, kozmetik, kişisel bakım vs.)
- Niteliği itibariyle iade edilemeyecek ürünler`
  },
  "mucbir-sebep": {
    title: "Mücbir Sebep",
    content: `Tarafların kontrolünde olmayan; tabii afetler, yangın, patlamalar, iç savaşlar, savaşlar, ayaklanmalar, halk hareketleri, seferberlik ilanı, grev, lokavt ve salgın hastalıklar, altyapı ve internet arızaları, elektrik kesintisi gibi sebeplerden (aşağıda birlikte "Mücbir Sebep" olarak anılacaktır.) dolayı sözleşmeden doğan yükümlülükler taraflarca ifa edilemez hale gelirse, taraflar bundan sorumlu değildir. Bu sürede Taraflar'ın işbu Sözleşme'den doğan hak ve yükümlülükleri askıya alınır.`
  },
  "uyusmazliklarin-cozumu": {
    title: "Uyuşmazlıkların Çözümü",
    content: `İşbu Sözleşmeden doğan uyuşmazlıklarda yetkili ve görevli yargı merciinin belirlenmesinde 6502 sayılı Tüketicinin Korunması Hakkında Kanun hükümleri esas alınacaktır.`
  },
  "odeme-sekli-ve-temerrut": {
    title: "Ödeme Şekli ve Temerrüt",
    content: `ALICI, vadeli satışların sadece Bankalara ait kredi kartları ile yapılması nedeniyle, alıcı, ilgili faiz oranlarını ve temerrüt faizi ile ilgili bilgileri bankasından ayrıca teyit edeceğini, yürürlükte bulunan mevzuat hükümleri gereğince faiz ve temerrüt faizi ile ilgili hükümlerin Banka ve alıcı arasındaki kredi kartı sözleşmesi kapsamında uygulanacağını kabul, beyan ve taahhüt eder.

SATICI'nın kanunen taksitle satış sayılan hallerdeki yasal hakları (taksitlerden herhangi birinin ödenmemesi halinde sözleşmeyi fesih ve/veya kalan borcun tümünün temerrüt faizi ile birlikte ödenmesini talep hakları dahil) mevcut ve saklıdır.

Kredi kartının hesap kesim tarihinden itibaren sipariş toplamı taksit adedine bölünerek kredi kartı özetinize banka tarafından yansıtılacaktır. Banka taksit tutarlarını küsurat farklarını dikkate alarak aylara eşit olarak dağıtmayabilir. Detaylı ödeme planınızın oluşturulması banka inisiyatifindedir.`
  },
  "delil-anlasmasi": {
    title: "Delil Anlaşması",
    content: `Alıcı, işbu Sözleşme'den doğabilecek ihtilaflarda Satıcı'nın resmi defter ve ticari kayıtlarıyla, kendi veri tabanında, sunucularında tuttuğu elektronik bilgilerin, whatsapp ve mail konuşmalarının ve bilgisayar kayıtlarının, bağlayıcı, kesin ve münhasır delil teşkil edeceğini kabul, beyan ve taahhüt eder. Bu maddenin Hukuk Muhakemeleri Kanunu'nun 193. maddesi anlamında delil sözleşmesi niteliğinde olduğunu kabul, beyan ve taahhüt eder.`
  },
  "mesafeli-satis-sozlesmesi": {
    title: "Mesafeli Satış Sözleşmesi",
    content: `MESAFELİ SATIŞ SÖZLEŞMESİ

1.TARAFLAR
İşbu Mesafeli Satış Sözleşmesi (kısaca "Sözleşme") Alıcı ve Satıcı arasında elektronik ortamda imzalanmıştır.

2. KONU
İşbu Sözleşme'nin konusu, Alıcı'nın Satıcı'ya ait [ALAN ADI] alan adı altındaki internet sitesinden (kısaca "Site") elektronik ortamda siparişini verdiği ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkındaki Kanun ve 27.02.2015 yürürlük tarihli Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin düzenlenmesidir.

Alıcı, Sitede Sözleşme konusu ürünün temel nitelikleri, nakliye, kargo, KDV ve diğer her türlü ek bedel dahil toplam satış fiyatı ve ödeme şekli ile teslimata ilişkin ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda ürünün satışının gerçekleşmesine dair onay verdiğini beyan eder.

Sözleşme konusu ürünler, yasal 30 günlük süreyi aşmamak koşulu ile Alıcı'nın yerleşim yerinin uzaklığına bağlı olarak teslim edilir.

İşbu Sözleşmede belirtilen nakliye / kargo ücreti Alıcı tarafından ödenecektir.

Malın Satıcı tarafından kargoya verilmesinden sonra ve fakat Alıcı tarafından teslim alınmasından önce Alıcı tarafından yapılan sipariş iptallerinde kargo bedelinden Alıcı sorumludur.

Satıcı, Sözleşme konusu Ürünlerin sağlam, eksiksiz, siparişte belirtilen niteliklere uygun ve varsa garanti belgeleri ve kullanım kılavuzları ile teslim edilmesinden sorumludur.

Satıcı, Alıcı'ya tesliminin imkansız hale gelmesi nedeniyle Sözleşme konusu yükümlülüklerini yerine getiremezse, bu durumu öğrenmesini takip eden 3 (üç) gün içinde Alıcı'ya bildirim yapmak ve işbu bildirimi takip eden 14 (ondört) günlük süre içinde Alıcı'dan tahsil ettiği tüm bedeli iade etmekle yükümlüdür.`
  },
  "gizlilik-ve-guvenlik": {
    title: "Gizlilik Politikası",
    content: `Gizlilik ve Güvenlik

Mağazamızda verilen tüm servisler [ŞİRKET ADI] firmamıza aittir ve firmamız tarafından işletilir.

Firmamız, çeşitli amaçlarla kişisel veriler toplayabilir.

Üyelik veya Mağazamız üzerindeki çeşitli form ve anketlerin doldurulması suretiyle üyelerin kendileriyle ilgili bir takım kişisel bilgileri (isim-soy isim, firma bilgileri, telefon, adres veya e-posta adresleri gibi) Mağazamız tarafından işin doğası gereği toplanmaktadır.

Firmamız bazı dönemlerde müşterilerine ve üyelerine kampanya bilgileri, yeni ürünler hakkında bilgiler, promosyon teklifleri gönderebilir.

Sistemle ilgili sorunların tanımlanması ve verilen hizmet ile ilgili çıkabilecek sorunların veya uyuşmazlıkların hızla çözülmesi için, Firmamız, üyelerinin IP adresini kaydetmekte ve bunu kullanmaktadır.

Firmamız, gizli bilgileri kesinlikle özel ve gizli tutmayı, bunu bir sır saklama yükümü olarak addetmeyi ve gizliliğin sağlanması ve sürdürülmesi, gizli bilginin tamamının veya herhangi bir kısmının kamu alanına girmesini veya yetkisiz kullanımını veya üçüncü bir kişiye ifşasını önlemek için gerekli tüm tedbirleri almayı ve gerekli özeni göstermeyi taahhüt etmektedir.

KREDİ KARTI GÜVENLİĞİ
Firmamız, alışveriş sitelerimizden alışveriş yapan kredi kartı sahiplerinin güvenliğini ilk planda tutmaktadır. Kredi kartı bilgileriniz hiçbir şekilde sistemimizde saklanmamaktadır. Alışveriş sırasında kullanılan kredi kartı ile ilgili bilgiler alışveriş sitelerimizden bağımsız olarak 128 bit SSL (Secure Sockets Layer) protokolü ile şifrelenip sorgulanmak üzere ilgili bankaya ulaştırılır.

E-POSTA GÜVENLİĞİ
Mağazamızın Müşteri Hizmetleri'ne, herhangi bir siparişinizle ilgili olarak göndereceğiniz e-postalarda, asla kredi kartı numaranızı veya şifrelerinizi yazmayınız.

TARAYICI ÇEREZLERİ
Firmamız, mağazamızı ziyaret eden kullanıcılar ve kullanıcıların web sitesini kullanımı hakkındaki bilgileri teknik bir iletişim dosyası (Çerez-Cookie) kullanarak elde edebilir.`
  }
}
