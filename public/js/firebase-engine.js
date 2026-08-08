// Firebase Realtime Database Engine for Deal or No Deal Football Draft

// Firebase Init using provided Database URL
const firebaseConfig = {
  databaseURL: "https://cuafa-9f3b6-default-rtdb.firebaseio.com"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// HTML Sanitizer to prevent XSS injection
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Persistent Unique Player ID
let myPlayerId = sessionStorage.getItem('dond_tab_player_id');
if (!myPlayerId) {
  myPlayerId = 'p_' + Math.random().toString(36).substring(2, 10);
  sessionStorage.setItem('dond_tab_player_id', myPlayerId);
}

// Database of real football stars, icons, legends and managers (260+ Players)
const PLAYER_DATABASE = {
  GK: [
    { id: 'gk1', name: 'Thibaut Courtois', rating: 90, club: 'Real Madrid', nation: 'Belgium' },
    { id: 'gk2', name: 'Alisson Becker', rating: 89, club: 'Liverpool', nation: 'Brazil' },
    { id: 'gk3', name: 'Gianluigi Donnarumma', rating: 88, club: 'PSG', nation: 'Italy' },
    { id: 'gk4', name: 'Marc-André ter Stegen', rating: 89, club: 'Barcelona', nation: 'Germany' },
    { id: 'gk5', name: 'Emiliano Martínez', rating: 87, club: 'Aston Villa', nation: 'Argentina' },
    { id: 'gk6', name: 'Ederson', rating: 88, club: 'Manchester City', nation: 'Brazil' },
    { id: 'gk7', name: 'Jan Oblak', rating: 88, club: 'Atletico Madrid', nation: 'Slovenia' },
    { id: 'gk8', name: 'Yassine Bounou', rating: 86, club: 'Al-Hilal', nation: 'Morocco' },
    { id: 'gk9', name: 'Manuel Neuer 🌟', rating: 91, club: 'Bayern Munich', nation: 'Germany' },
    { id: 'gk10', name: 'Gianluigi Buffon 👑', rating: 93, club: 'Legend Icon', nation: 'Italy' },
    { id: 'gk11', name: 'Iker Casillas 👑', rating: 92, club: 'Legend Icon', nation: 'Spain' },
    { id: 'gk12', name: 'Lev Yashin 👑', rating: 94, club: 'Legend Icon', nation: 'Russia' },
    { id: 'gk13', name: 'David Raya', rating: 86, club: 'Arsenal', nation: 'Spain' },
    { id: 'gk14', name: 'Unai Simón', rating: 85, club: 'Athletic Bilbao', nation: 'Spain' },
    { id: 'gk15', name: 'Oliver Kahn 👑', rating: 91, club: 'Legend Icon', nation: 'Germany' },
    { id: 'gk16', name: 'Petr Čech 👑', rating: 90, club: 'Legend Icon', nation: 'Czech Republic' },
    { id: 'gk17', name: 'Edwin van der Sar 👑', rating: 89, club: 'Legend Icon', nation: 'Netherlands' },
    { id: 'gk18', name: 'Peter Schmeichel 👑', rating: 90, club: 'Legend Icon', nation: 'Denmark' },
    { id: 'gk19', name: 'Mike Maignan', rating: 87, club: 'AC Milan', nation: 'France' },
    { id: 'gk20', name: 'Gregor Kobel', rating: 86, club: 'Dortmund', nation: 'Switzerland' },
    { id: 'gk21', name: 'Yann Sommer', rating: 86, club: 'Inter Milan', nation: 'Switzerland' },
    { id: 'gk22', name: 'Guglielmo Vicario', rating: 84, club: 'Tottenham', nation: 'Italy' },
    { id: 'gk23', name: 'Nick Pope', rating: 84, club: 'Newcastle', nation: 'England' },
    { id: 'gk24', name: 'Keylor Navas 🌟', rating: 85, club: 'Free Agent', nation: 'Costa Rica' },
    { id: 'gk25', name: 'David de Gea', rating: 84, club: 'Fiorentina', nation: 'Spain' },
    { id: 'gk26', name: 'Jordan Pickford', rating: 84, club: 'Everton', nation: 'England' },
    { id: 'gk27', name: 'Andriy Lunin', rating: 83, club: 'Real Madrid', nation: 'Ukraine' },
    { id: 'gk28', name: 'Diogo Costa', rating: 85, club: 'Porto', nation: 'Portugal' },
    { id: 'gk29', name: 'Aaron Ramsdale', rating: 82, club: 'Southampton', nation: 'England' },
    { id: 'gk30', name: 'Claudio Bravo 👑', rating: 85, club: 'Legend Icon', nation: 'Chile' }
  ],
  DEF: [
    { id: 'def1', name: 'Virgil van Dijk', rating: 90, club: 'Liverpool', nation: 'Netherlands' },
    { id: 'def2', name: 'Rúben Dias', rating: 89, club: 'Manchester City', nation: 'Portugal' },
    { id: 'def3', name: 'Antonio Rüdiger', rating: 87, club: 'Real Madrid', nation: 'Germany' },
    { id: 'def4', name: 'Achraf Hakimi', rating: 86, club: 'PSG', nation: 'Morocco' },
    { id: 'def5', name: 'William Saliba', rating: 88, club: 'Arsenal', nation: 'France' },
    { id: 'def6', name: 'Theo Hernández', rating: 86, club: 'AC Milan', nation: 'France' },
    { id: 'def7', name: 'Marquinhos', rating: 87, club: 'PSG', nation: 'Brazil' },
    { id: 'def8', name: 'Trent Alexander-Arnold', rating: 86, club: 'Liverpool', nation: 'England' },
    { id: 'def9', name: 'Paolo Maldini 👑', rating: 95, club: 'Legend Icon', nation: 'Italy' },
    { id: 'def10', name: 'Sergio Ramos 👑', rating: 92, club: 'Legend Icon', nation: 'Spain' },
    { id: 'def11', name: 'Roberto Carlos 👑', rating: 91, club: 'Legend Icon', nation: 'Brazil' },
    { id: 'def12', name: 'Carles Puyol 👑', rating: 91, club: 'Legend Icon', nation: 'Spain' },
    { id: 'def13', name: 'Gabriel Magalhães', rating: 86, club: 'Arsenal', nation: 'Brazil' },
    { id: 'def14', name: 'Éder Militão', rating: 86, club: 'Real Madrid', nation: 'Brazil' },
    { id: 'def15', name: 'Franco Baresi 👑', rating: 93, club: 'Legend Icon', nation: 'Italy' },
    { id: 'def16', name: 'Fabio Cannavaro 👑', rating: 92, club: 'Legend Icon', nation: 'Italy' },
    { id: 'def17', name: 'Alessandro Nesta 👑', rating: 92, club: 'Legend Icon', nation: 'Italy' },
    { id: 'def18', name: 'Cafu 👑', rating: 92, club: 'Legend Icon', nation: 'Brazil' },
    { id: 'def19', name: 'Philipp Lahm 👑', rating: 90, club: 'Legend Icon', nation: 'Germany' },
    { id: 'def20', name: 'Javier Zanetti 👑', rating: 90, club: 'Legend Icon', nation: 'Argentina' },
    { id: 'def21', name: 'Dani Carvajal', rating: 86, club: 'Real Madrid', nation: 'Spain' },
    { id: 'def22', name: 'Kyle Walker', rating: 85, club: 'Manchester City', nation: 'England' },
    { id: 'def23', name: 'Ronald Araújo', rating: 86, club: 'Barcelona', nation: 'Uruguay' },
    { id: 'def24', name: 'Alphonso Davies', rating: 85, club: 'Bayern Munich', nation: 'Canada' },
    { id: 'def25', name: 'Federico Dimarco', rating: 85, club: 'Inter Milan', nation: 'Italy' },
    { id: 'def26', name: 'Jeremie Frimpong', rating: 86, club: 'Bayer Leverkusen', nation: 'Netherlands' },
    { id: 'def27', name: 'Alessandro Bastoni', rating: 87, club: 'Inter Milan', nation: 'Italy' },
    { id: 'def28', name: 'Josko Gvardiol', rating: 85, club: 'Manchester City', nation: 'Croatia' },
    { id: 'def29', name: 'João Cancelo', rating: 85, club: 'Al-Hilal', nation: 'Portugal' },
    { id: 'def30', name: 'Andrew Robertson', rating: 85, club: 'Liverpool', nation: 'Scotland' },
    { id: 'def31', name: 'Kim Min-jae', rating: 85, club: 'Bayern Munich', nation: 'South Korea' },
    { id: 'def32', name: 'Cristian Romero', rating: 86, club: 'Tottenham', nation: 'Argentina' },
    { id: 'def33', name: 'Bremer', rating: 85, club: 'Juventus', nation: 'Brazil' },
    { id: 'def34', name: 'Jules Koundé', rating: 85, club: 'Barcelona', nation: 'France' },
    { id: 'def35', name: 'Ben White', rating: 84, club: 'Arsenal', nation: 'England' },
    { id: 'def36', name: 'Marc Cucurella 🌟', rating: 84, club: 'Chelsea', nation: 'Spain' },
    { id: 'def37', name: 'Destiny Udogie', rating: 83, club: 'Tottenham', nation: 'Italy' },
    { id: 'def38', name: 'Rio Ferdinand 👑', rating: 91, club: 'Legend Icon', nation: 'England' },
    { id: 'def39', name: 'Nemanja Vidić 👑', rating: 90, club: 'Legend Icon', nation: 'Serbia' },
    { id: 'def40', name: 'John Terry 👑', rating: 90, club: 'Legend Icon', nation: 'England' },
    { id: 'def41', name: 'Ronald Koeman 👑', rating: 91, club: 'Legend Icon', nation: 'Netherlands' },
    { id: 'def42', name: 'Jaap Stam 👑', rating: 89, club: 'Legend Icon', nation: 'Netherlands' },
    { id: 'def43', name: 'Lilian Thuram 👑', rating: 90, club: 'Legend Icon', nation: 'France' },
    { id: 'def44', name: 'Fernando Hierro 👑', rating: 89, club: 'Legend Icon', nation: 'Spain' }
  ],
  MID: [
    { id: 'mid1', name: 'Jude Bellingham', rating: 90, club: 'Real Madrid', nation: 'England' },
    { id: 'mid2', name: 'Kevin De Bruyne', rating: 91, club: 'Manchester City', nation: 'Belgium' },
    { id: 'mid3', name: 'Rodri', rating: 91, club: 'Manchester City', nation: 'Spain' },
    { id: 'mid4', name: 'Luka Modrić', rating: 87, club: 'Real Madrid', nation: 'Croatia' },
    { id: 'mid5', name: 'Pedri', rating: 86, club: 'Barcelona', nation: 'Spain' },
    { id: 'mid6', name: 'Federico Valverde', rating: 88, club: 'Real Madrid', nation: 'Uruguay' },
    { id: 'mid7', name: 'Jamal Musiala', rating: 88, club: 'Bayern Munich', nation: 'Germany' },
    { id: 'mid8', name: 'Bruno Fernandes', rating: 88, club: 'Manchester Utd', nation: 'Portugal' },
    { id: 'mid9', name: 'Zinedine Zidane 👑', rating: 96, club: 'Legend Icon', nation: 'France' },
    { id: 'mid10', name: 'Ronaldinho 👑', rating: 94, club: 'Legend Icon', nation: 'Brazil' },
    { id: 'mid11', name: 'Andrés Iniesta 👑', rating: 93, club: 'Legend Icon', nation: 'Spain' },
    { id: 'mid12', name: 'Xavi Hernández 👑', rating: 92, club: 'Legend Icon', nation: 'Spain' },
    { id: 'mid13', name: 'Martin Ødegaard', rating: 88, club: 'Arsenal', nation: 'Norway' },
    { id: 'mid14', name: 'Eduardo Camavinga', rating: 85, club: 'Real Madrid', nation: 'France' },
    { id: 'mid15', name: 'Andrea Pirlo 👑', rating: 92, club: 'Legend Icon', nation: 'Italy' },
    { id: 'mid16', name: 'Lothar Matthäus 👑', rating: 93, club: 'Legend Icon', nation: 'Germany' },
    { id: 'mid17', name: 'Ruud Gullit 👑', rating: 93, club: 'Legend Icon', nation: 'Netherlands' },
    { id: 'mid18', name: 'Kaká 👑', rating: 91, club: 'Legend Icon', nation: 'Brazil' },
    { id: 'mid19', name: 'Steven Gerrard 👑', rating: 90, club: 'Legend Icon', nation: 'England' },
    { id: 'mid20', name: 'Frank Lampard 👑', rating: 90, club: 'Legend Icon', nation: 'England' },
    { id: 'mid21', name: 'Toni Kroos 👑', rating: 90, club: 'Legend Icon', nation: 'Germany' },
    { id: 'mid22', name: 'Declan Rice', rating: 87, club: 'Arsenal', nation: 'England' },
    { id: 'mid23', name: 'Alexis Mac Allister', rating: 86, club: 'Liverpool', nation: 'Argentina' },
    { id: 'mid24', name: 'Aurélien Tchouaméni', rating: 86, club: 'Real Madrid', nation: 'France' },
    { id: 'mid25', name: 'Nicolò Barella', rating: 87, club: 'Inter Milan', nation: 'Italy' },
    { id: 'mid26', name: 'Frenkie de Jong', rating: 87, club: 'Barcelona', nation: 'Netherlands' },
    { id: 'mid27', name: 'Florian Wirtz', rating: 89, club: 'Bayer Leverkusen', nation: 'Germany' },
    { id: 'mid28', name: 'Bernardo Silva', rating: 88, club: 'Manchester City', nation: 'Portugal' },
    { id: 'mid29', name: 'Sergio Busquets 👑', rating: 89, club: 'Inter Miami / Icon', nation: 'Spain' },
    { id: 'mid30', name: 'Casemiro', rating: 85, club: 'Manchester Utd', nation: 'Brazil' },
    { id: 'mid31', name: 'N\'Golo Kanté 🌟', rating: 86, club: 'Al-Ittihad', nation: 'France' },
    { id: 'mid32', name: 'Ilkay Gündogan', rating: 86, club: 'Manchester City', nation: 'Germany' },
    { id: 'mid33', name: 'Dominik Szoboszlai', rating: 85, club: 'Liverpool', nation: 'Hungary' },
    { id: 'mid34', name: 'Kobbie Mainoo 🌟', rating: 83, club: 'Manchester Utd', nation: 'England' },
    { id: 'mid35', name: 'Warren Zaïre-Emery', rating: 83, club: 'PSG', nation: 'France' },
    { id: 'mid36', name: 'Xavi Simons', rating: 85, club: 'RB Leipzig', nation: 'Netherlands' },
    { id: 'mid37', name: 'Ryan Gravenberch', rating: 84, club: 'Liverpool', nation: 'Netherlands' },
    { id: 'mid38', name: 'Paul Scholes 👑', rating: 89, club: 'Legend Icon', nation: 'England' },
    { id: 'mid39', name: 'David Beckham 👑', rating: 89, club: 'Legend Icon', nation: 'England' },
    { id: 'mid40', name: 'Pavel Nedvěd 👑', rating: 90, club: 'Legend Icon', nation: 'Czech Republic' },
    { id: 'mid41', name: 'Juan Román Riquelme 👑', rating: 90, club: 'Legend Icon', nation: 'Argentina' },
    { id: 'mid42', name: 'Gheorghe Hagi 👑', rating: 89, club: 'Legend Icon', nation: 'Romania' },
    { id: 'mid43', name: 'Clarence Seedorf 👑', rating: 89, club: 'Legend Icon', nation: 'Netherlands' },
    { id: 'mid44', name: 'Claude Makélélé 👑', rating: 88, club: 'Legend Icon', nation: 'France' }
  ],
  ATT: [
    { id: 'att1', name: 'Kylian Mbappé', rating: 91, club: 'Real Madrid', nation: 'France' },
    { id: 'att2', name: 'Erling Haaland', rating: 91, club: 'Manchester City', nation: 'Norway' },
    { id: 'att3', name: 'Vinícius Júnior', rating: 90, club: 'Real Madrid', nation: 'Brazil' },
    { id: 'att4', name: 'Mohamed Salah', rating: 89, club: 'Liverpool', nation: 'Egypt' },
    { id: 'att5', name: 'Harry Kane', rating: 90, club: 'Bayern Munich', nation: 'England' },
    { id: 'att6', name: 'Robert Lewandowski', rating: 88, club: 'Barcelona', nation: 'Poland' },
    { id: 'att7', name: 'Lamine Yamal 🌟', rating: 87, club: 'Barcelona', nation: 'Spain' },
    { id: 'att8', name: 'Cristiano Ronaldo 👑', rating: 92, club: 'Al-Nassr / Icon', nation: 'Portugal' },
    { id: 'att9', name: 'Lionel Messi 👑', rating: 93, club: 'Inter Miami / Icon', nation: 'Argentina' },
    { id: 'att10', name: 'Pelé 👑', rating: 98, club: 'Legend Icon', nation: 'Brazil' },
    { id: 'att11', name: 'Diego Maradona 👑', rating: 97, club: 'Legend Icon', nation: 'Argentina' },
    { id: 'att12', name: 'Ronaldo Nazário R9 👑', rating: 96, club: 'Legend Icon', nation: 'Brazil' },
    { id: 'att13', name: 'Thierry Henry 👑', rating: 93, club: 'Legend Icon', nation: 'France' },
    { id: 'att14', name: 'Bukayo Saka', rating: 88, club: 'Arsenal', nation: 'England' },
    { id: 'att15', name: 'Johan Cruyff 👑', rating: 95, club: 'Legend Icon', nation: 'Netherlands' },
    { id: 'att16', name: 'Marco van Basten 👑', rating: 93, club: 'Legend Icon', nation: 'Netherlands' },
    { id: 'att17', name: 'Gerd Müller 👑', rating: 94, club: 'Legend Icon', nation: 'Germany' },
    { id: 'att18', name: 'Eusébio 👑', rating: 93, club: 'Legend Icon', nation: 'Portugal' },
    { id: 'att19', name: 'George Best 👑', rating: 92, club: 'Legend Icon', nation: 'Northern Ireland' },
    { id: 'att20', name: 'Rivaldo 👑', rating: 92, club: 'Legend Icon', nation: 'Brazil' },
    { id: 'att21', name: 'Samuel Eto\'o 👑', rating: 90, club: 'Legend Icon', nation: 'Cameroon' },
    { id: 'att22', name: 'Didier Drogba 👑', rating: 89, club: 'Legend Icon', nation: 'Ivory Coast' },
    { id: 'att23', name: 'Neymar Jr 🌟', rating: 89, club: 'Al-Hilal', nation: 'Brazil' },
    { id: 'att24', name: 'Rodrygo', rating: 86, club: 'Real Madrid', nation: 'Brazil' },
    { id: 'att25', name: 'Antoine Griezmann', rating: 88, club: 'Atletico Madrid', nation: 'France' },
    { id: 'att26', name: 'Lautaro Martínez', rating: 89, club: 'Inter Milan', nation: 'Argentina' },
    { id: 'att27', name: 'Victor Osimhen', rating: 87, club: 'Galatasaray', nation: 'Nigeria' },
    { id: 'att28', name: 'Julián Álvarez', rating: 86, club: 'Atletico Madrid', nation: 'Argentina' },
    { id: 'att29', name: 'Phil Foden', rating: 89, club: 'Manchester City', nation: 'England' },
    { id: 'att30', name: 'Cole Palmer', rating: 86, club: 'Chelsea', nation: 'England' },
    { id: 'att31', name: 'Heung-min Son', rating: 87, club: 'Tottenham', nation: 'South Korea' },
    { id: 'att32', name: 'Khvicha Kvaratskhelia', rating: 86, club: 'Napoli', nation: 'Georgia' },
    { id: 'att33', name: 'Rafael Leão', rating: 86, club: 'AC Milan', nation: 'Portugal' },
    { id: 'att34', name: 'Alexander Isak', rating: 85, club: 'Newcastle', nation: 'Sweden' },
    { id: 'att35', name: 'Viktor Gyökeres 🌟', rating: 87, club: 'Sporting CP', nation: 'Sweden' },
    { id: 'att36', name: 'Serhou Guirassy', rating: 85, club: 'Dortmund', nation: 'Guinea' },
    { id: 'att37', name: 'Loïs Openda', rating: 85, club: 'RB Leipzig', nation: 'Belgium' },
    { id: 'att38', name: 'Benjamin Šeško', rating: 84, club: 'RB Leipzig', nation: 'Slovenia' },
    { id: 'att39', name: 'Endrick 🌟', rating: 83, club: 'Real Madrid', nation: 'Brazil' },
    { id: 'att40', name: 'Nico Williams', rating: 86, club: 'Athletic Bilbao', nation: 'Spain' },
    { id: 'att41', name: 'Takefusa Kubo', rating: 84, club: 'Real Sociedad', nation: 'Japan' },
    { id: 'att42', name: 'Kaoru Mitoma', rating: 84, club: 'Brighton', nation: 'Japan' },
    { id: 'att43', name: 'Gabriel Martinelli', rating: 85, club: 'Arsenal', nation: 'Brazil' },
    { id: 'att44', name: 'Luis Díaz', rating: 86, club: 'Liverpool', nation: 'Colombia' },
    { id: 'att45', name: 'Darwin Núñez', rating: 84, club: 'Liverpool', nation: 'Uruguay' },
    { id: 'att46', name: 'Federico Chiesa', rating: 84, club: 'Liverpool', nation: 'Italy' },
    { id: 'att47', name: 'Paulo Dybala', rating: 86, club: 'Roma', nation: 'Argentina' },
    { id: 'att48', name: 'Dušan Vlahović', rating: 85, club: 'Juventus', nation: 'Serbia' },
    { id: 'att49', name: 'Luis Suárez 👑', rating: 91, club: 'Legend Icon', nation: 'Uruguay' },
    { id: 'att50', name: 'Sergio Agüero 👑', rating: 90, club: 'Legend Icon', nation: 'Argentina' },
    { id: 'att51', name: 'Zlatan Ibrahimović 👑', rating: 91, club: 'Legend Icon', nation: 'Sweden' },
    { id: 'att52', name: 'David Villa 👑', rating: 90, club: 'Legend Icon', nation: 'Spain' },
    { id: 'att53', name: 'Fernando Torres 👑', rating: 89, club: 'Legend Icon', nation: 'Spain' },
    { id: 'att54', name: 'Andriy Shevchenko 👑', rating: 91, club: 'Legend Icon', nation: 'Ukraine' },
    { id: 'att55', name: 'Gabriel Batistuta 👑', rating: 90, club: 'Legend Icon', nation: 'Argentina' },
    { id: 'att56', name: 'Romário 👑', rating: 94, club: 'Legend Icon', nation: 'Brazil' },
    { id: 'att57', name: 'Ferenc Puskás 👑', rating: 94, club: 'Legend Icon', nation: 'Hungary' },
    { id: 'att58', name: 'Alfredo Di Stéfano 👑', rating: 93, club: 'Legend Icon', nation: 'Argentina' },
    { id: 'att59', name: 'Eric Cantona 👑', rating: 90, club: 'Legend Icon', nation: 'France' },
    { id: 'att60', name: 'Raúl González 👑', rating: 90, club: 'Legend Icon', nation: 'Spain' },
    { id: 'att61', name: 'Roberto Baggio 👑', rating: 93, club: 'Legend Icon', nation: 'Italy' },
    { id: 'att62', name: 'Alessandro Del Piero 👑', rating: 90, club: 'Legend Icon', nation: 'Italy' }
  ],
  MGR: [
    { id: 'mgr1', name: 'Pep Guardiola', rating: 92, club: 'Manchester City', nation: 'Spain' },
    { id: 'mgr2', name: 'Carlo Ancelotti', rating: 92, club: 'Real Madrid', nation: 'Italy' },
    { id: 'mgr3', name: 'Jürgen Klopp', rating: 90, club: 'Free Agent', nation: 'Germany' },
    { id: 'mgr4', name: 'Mikel Arteta', rating: 88, club: 'Arsenal', nation: 'Spain' },
    { id: 'mgr5', name: 'José Mourinho', rating: 87, club: 'Fenerbahçe', nation: 'Portugal' },
    { id: 'mgr6', name: 'Luis Enrique', rating: 88, club: 'PSG', nation: 'Spain' },
    { id: 'mgr7', name: 'Xabi Alonso', rating: 89, club: 'Bayer Leverkusen', nation: 'Spain' },
    { id: 'mgr8', name: 'Lionel Scaloni', rating: 89, club: 'Argentina', nation: 'Argentina' },
    { id: 'mgr9', name: 'Sir Alex Ferguson 👑', rating: 96, club: 'Legend Icon', nation: 'Scotland' },
    { id: 'mgr10', name: 'Zinedine Zidane MGR 👑', rating: 92, club: 'Legend Icon', nation: 'France' },
    { id: 'mgr11', name: 'Arsène Wenger 👑', rating: 91, club: 'Legend Icon', nation: 'France' },
    { id: 'mgr12', name: 'Johan Cruyff MGR 👑', rating: 93, club: 'Legend Icon', nation: 'Netherlands' },
    { id: 'mgr13', name: 'Simone Inzaghi', rating: 88, club: 'Inter Milan', nation: 'Italy' },
    { id: 'mgr14', name: 'Hansi Flick', rating: 88, club: 'Barcelona', nation: 'Germany' },
    { id: 'mgr15', name: 'Arne Slot', rating: 86, club: 'Liverpool', nation: 'Netherlands' },
    { id: 'mgr16', name: 'Unai Emery', rating: 86, club: 'Aston Villa', nation: 'Spain' },
    { id: 'mgr17', name: 'Roberto De Zerbi', rating: 85, club: 'Marseille', nation: 'Italy' },
    { id: 'mgr18', name: 'Ruben Amorim', rating: 86, club: 'Manchester Utd', nation: 'Portugal' },
    { id: 'mgr19', name: 'Enzo Maresca', rating: 84, club: 'Chelsea', nation: 'Italy' },
    { id: 'mgr20', name: 'Ange Postecoglou', rating: 85, club: 'Tottenham', nation: 'Australia' },
    { id: 'mgr21', name: 'Julian Nagelsmann', rating: 88, club: 'Germany', nation: 'Germany' },
    { id: 'mgr22', name: 'Didier Deschamps', rating: 89, club: 'France', nation: 'France' },
    { id: 'mgr23', name: 'Luciano Spalletti', rating: 87, club: 'Italy', nation: 'Italy' },
    { id: 'mgr24', name: 'Luis de la Fuente', rating: 88, club: 'Spain', nation: 'Spain' },
    { id: 'mgr25', name: 'Marcelo Bielsa 👑', rating: 87, club: 'Uruguay', nation: 'Argentina' },
    { id: 'mgr26', name: 'Fabio Capello 👑', rating: 90, club: 'Legend Icon', nation: 'Italy' },
    { id: 'mgr27', name: 'Marcello Lippi 👑', rating: 91, club: 'Legend Icon', nation: 'Italy' },
    { id: 'mgr28', name: 'Arrigo Sacchi 👑', rating: 92, club: 'Legend Icon', nation: 'Italy' },
    { id: 'mgr29', name: 'Vicente del Bosque 👑', rating: 91, club: 'Legend Icon', nation: 'Spain' }
  ]
};

// Rarity/probability display: % of players at-or-above this rating, within its
// own position pool — grounded in the real data instead of an invented number.
function computeRarityTable() {
  const table = {};
  Object.keys(PLAYER_DATABASE).forEach(posKey => {
    const pool = PLAYER_DATABASE[posKey];
    const total = pool.length;
    table[posKey] = {};
    pool.forEach(p => {
      if (table[posKey][p.id] !== undefined) return;
      const atOrAbove = pool.filter(q => q.rating >= p.rating).length;
      table[posKey][p.id] = Math.max(1, Math.round((atOrAbove / total) * 100));
    });
  });
  return table;
}
const RARITY_TABLE = computeRarityTable();

function isIconLegend(name) {
  return /[👑🌟]/.test(name || '');
}

const HELPER_CARDS = [
  { id: 'steal', name: 'سرقة لاعب 🥷', desc: 'تبديل لاعب من تشكيلتك بآخر من الخصم!' },
  { id: 'protection', name: 'درع الحماية 🛡️', desc: 'قوة دفاعية +15% أثناء المحاكاة، وتقدر تحمي لاعب واحد من تشكيلتك من السرقة!' },
  { id: 'extra_chance', name: 'فرصة إضافية 🎲', desc: 'تتيح تجربة 3 بطاقات بدلاً من بطاقتين!' },
  { id: 'force_pick', name: 'إجبار الاختيار 🎯', desc: 'طلعلك لاعب مش عايزه؟ جبّر خصمك ياخده بدل مركزه، وياخدلك إنت فرصة تختار لاعب تاني!' },
  { id: 'random_pick', name: 'حظ عشوائي 🎰', desc: 'تكشف البطاقات الأربعة كلها وتاخد واحدة عشوائي فورًا من غير ما تختار بنفسك!' },
  { id: 'free_pick', name: 'اختيار حر 👁️', desc: 'تكشف البطاقات الأربعة كلها وتختار إنت بنفسك أي واحدة عايزها، مضمونة 100%!' }
];

const POSITIONS = ['GK', 'DEF', 'MID', 'ATT', 'MGR'];
const POSITION_NAMES_AR = {
  GK: 'حارس المرمى 🧤',
  DEF: 'المدافع 🛡️',
  MID: 'خط الوسط ⚽',
  ATT: 'المهاجم 🔥',
  MGR: 'المدرب 📋'
};

function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateBriefcases(positionKey, hasPlayerGivenHelper) {
  const available = PLAYER_DATABASE[positionKey];
  const selected4 = getRandomItems(available, 4);

  let helperAssignedIndex = -1;
  if (!hasPlayerGivenHelper && Math.random() < 0.7) {
    helperAssignedIndex = Math.floor(Math.random() * 4);
  }

  return selected4.map((item, index) => {
    let helper = null;
    if (index === helperAssignedIndex) {
      helper = HELPER_CARDS[Math.floor(Math.random() * HELPER_CARDS.length)];
    }
    return {
      cardId: index,
      item: item,
      helperCard: helper,
      isRevealed: false
    };
  });
}

const FirebaseEngine = {
  get myPlayerId() {
    return myPlayerId;
  },

  getRarityPct(item, posKey) {
    return (item && posKey && RARITY_TABLE[posKey] && RARITY_TABLE[posKey][item.id]) || 50;
  },

  isIconLegend(name) {
    return isIconLegend(name);
  },

  enterRoom(roomId, playerName) {
    const finalRoomId = roomId && roomId.trim().length > 0
      ? roomId.trim()
      : Math.floor(1000 + Math.random() * 9000).toString();

    const roomRef = db.ref('dond_rooms/' + finalRoomId);

    return roomRef.once('value').then(snapshot => {
      const room = snapshot.val();

      if (!room || !room.host) {
        // Tab 1 -> Automatically Become Host!
        myPlayerId = 'p_host_' + Math.random().toString(36).substring(2, 10);
        sessionStorage.setItem('dond_tab_player_id', myPlayerId);

        const sanitizedHostName = escapeHTML(playerName || 'المستضيف');
        const initialRoom = {
          roomId: finalRoomId,
          status: 'drafting',
          createdAt: Date.now(),
          host: {
            id: myPlayerId,
            name: sanitizedHostName,
            squad: { GK: null, DEF: null, MID: null, ATT: null, MGR: null },
            helperCard: null,
            protectedPos: null
          },
          guest: null,
          spectatorsCount: 0,
          currentTurn: 'host',
          positionIndex: 0,
          turnState: {
            positionKey: 'GK',
            positionNameAr: POSITION_NAMES_AR['GK'],
            briefcases: generateBriefcases('GK', false),
            pickedBriefcaseIndex: null,
            pickNumber: 0,
            status: 'waiting_pick_1'
          },
          matchSimulation: null
        };

        return roomRef.set(initialRoom).then(() => finalRoomId);
      } else if (room.host && room.host.id === myPlayerId) {
        // Host reconnecting
        return finalRoomId;
      } else if (!room.guest) {
        // Tab 2 -> Automatically Become Guest!
        myPlayerId = 'p_guest_' + Math.random().toString(36).substring(2, 10);
        sessionStorage.setItem('dond_tab_player_id', myPlayerId);

        const sanitizedGuestName = escapeHTML((playerName && playerName !== 'المستضيف') ? playerName : 'الضيف');
        const guestData = {
          id: myPlayerId,
          name: sanitizedGuestName,
          squad: { GK: null, DEF: null, MID: null, ATT: null, MGR: null },
          helperCard: null,
          protectedPos: null
        };
        return roomRef.child('guest').set(guestData).then(() => finalRoomId);
      } else if (room.guest && room.guest.id === myPlayerId) {
        // Guest reconnecting
        return finalRoomId;
      } else {
        // Tab 3+ -> Become Spectator!
        myPlayerId = 'p_spec_' + Math.random().toString(36).substring(2, 10);
        sessionStorage.setItem('dond_tab_player_id', myPlayerId);

        const currentSpecs = room.spectatorsCount || 0;
        return roomRef.child('spectatorsCount').set(currentSpecs + 1).then(() => finalRoomId);
      }
    });
  },

  createRoom(roomId, playerName) {
    return this.enterRoom(roomId, playerName);
  },

  joinRoom(roomId, playerName, onError) {
    return this.enterRoom(roomId, playerName);
  },

  listenToRoom(roomId, onUpdate) {
    const roomRef = db.ref('dond_rooms/' + roomId);
    roomRef.on('value', snapshot => {
      const room = snapshot.val();
      if (room) {
        onUpdate(room);
      }
    });
  },

  pickBriefcase(roomId, briefcaseIndex, roomState) {
    const roomRef = db.ref('dond_rooms/' + roomId);
    const briefcases = [...roomState.turnState.briefcases];

    if (!briefcases[briefcaseIndex] || briefcases[briefcaseIndex].isRevealed) return;

    briefcases[briefcaseIndex].isRevealed = true;

    const isHost = roomState.currentTurn === 'host';
    const activePlayer = isHost ? roomState.host : roomState.guest;
    const hasExtraChance = activePlayer?.helperCard?.id === 'extra_chance';

    if (roomState.turnState.status === 'waiting_pick_1') {
      roomRef.child('turnState').update({
        briefcases: briefcases,
        pickedBriefcaseIndex: briefcaseIndex,
        pickNumber: 1,
        status: 'picked_1_pending_deal'
      });
    } else if (roomState.turnState.status === 'waiting_pick_2') {
      if (hasExtraChance) {
        // Extra-chance card grants a 3rd attempt instead of auto-finalizing
        roomRef.child('turnState').update({
          briefcases: briefcases,
          pickedBriefcaseIndex: briefcaseIndex,
          pickNumber: 2,
          status: 'picked_2_pending_deal'
        });
      } else {
        roomRef.child('turnState').update({
          briefcases: briefcases,
          pickedBriefcaseIndex: briefcaseIndex,
          pickNumber: 2,
          status: 'finished_turn'
        });
        this.finalizeSelection(roomId, roomState, briefcases[briefcaseIndex]);
      }
    } else if (roomState.turnState.status === 'waiting_pick_3') {
      roomRef.child('turnState').update({
        briefcases: briefcases,
        pickedBriefcaseIndex: briefcaseIndex,
        pickNumber: 3,
        status: 'finished_turn'
      });
      this.finalizeSelection(roomId, roomState, briefcases[briefcaseIndex], 'extra_chance');
    }
  },

  confirmDeal(roomId, roomState) {
    // Card is only consumed if the 3rd attempt is actually taken (see pickBriefcase's
    // waiting_pick_3 branch) — dealing after pick 2 keeps the card unused for next turn.
    const selectedB = roomState.turnState.briefcases[roomState.turnState.pickedBriefcaseIndex];
    this.finalizeSelection(roomId, roomState, selectedB);
  },

  rejectDeal(roomId, roomState) {
    const roomRef = db.ref('dond_rooms/' + roomId);
    const nextStatus = roomState.turnState.status === 'picked_2_pending_deal' ? 'waiting_pick_3' : 'waiting_pick_2';
    roomRef.child('turnState').update({
      status: nextStatus
    });
  },

  finalizeSelection(roomId, roomState, briefcase, consumeCardId) {
    const roomRef = db.ref('dond_rooms/' + roomId);
    const isHost = roomState.currentTurn === 'host';
    const playerKey = isHost ? 'host' : 'guest';
    const posKey = POSITIONS[roomState.positionIndex];

    // Reveal all remaining briefcases
    const allRevealedBriefcases = roomState.turnState.briefcases.map(b => ({
      ...b,
      isRevealed: true
    }));

    // Update squad item & helper
    const playerObj = roomState[playerKey];
    const newSquad = { ...playerObj.squad, [posKey]: briefcase.item };
    let newHelper = playerObj.helperCard || null;
    let helperJustDrawn = null;
    if (briefcase.helperCard && !newHelper) {
      newHelper = briefcase.helperCard;
      helperJustDrawn = briefcase.helperCard;
    } else if (consumeCardId && playerObj.helperCard && playerObj.helperCard.id === consumeCardId) {
      // Card consumed only for the acting player (playerKey), e.g. extra_chance
      // after its 3rd pick, or random_pick/free_pick right after they're used.
      newHelper = null;
    }

    roomRef.child(playerKey).update({
      squad: newSquad,
      helperCard: newHelper
    });

    roomRef.child('turnState/briefcases').set(allRevealedBriefcases);

    if (helperJustDrawn) {
      this.notify(roomId, {
        kind: 'helper_drawn',
        text: `🎁 حصل ${playerObj.name} على كارت مساعدة: ${helperJustDrawn.name}! (${helperJustDrawn.desc})`
      });
    }

    // Local patched snapshot so the delayed turn-transition below always sees
    // THIS pick's own update, even though `roomState` is a stale param frozen
    // at click time (fixes MGR/last-pick being dropped from the match simulation).
    const patchedRoomState = {
      ...roomState,
      [playerKey]: { ...playerObj, squad: newSquad, helperCard: newHelper }
    };

    // Transition turn after 3.5 seconds
    setTimeout(() => {
      let nextTurn = patchedRoomState.currentTurn;
      let nextPosIndex = patchedRoomState.positionIndex;

      if (roomState.turnState.dumpedThisPosition) {
        // The opponent's slot for this position was already force-filled by
        // dumpOnOpponent() — the position is fully resolved either way, so
        // skip straight to the next one instead of passing the turn.
        nextTurn = 'host';
        nextPosIndex++;
      } else if (isHost) {
        nextTurn = 'guest';
      } else {
        nextTurn = 'host';
        nextPosIndex++;
      }

      if (nextPosIndex >= POSITIONS.length) {
        // Draft complete — show both lineups before the simulation starts
        roomRef.update({ status: 'lineup' });
      } else {
        const nextPosKey = POSITIONS[nextPosIndex];
        const hasHelperObj = isHost ? !!patchedRoomState.guest?.helperCard : !!patchedRoomState.host?.helperCard;
        const newBriefcases = generateBriefcases(nextPosKey, hasHelperObj);

        roomRef.update({
          currentTurn: nextTurn,
          positionIndex: nextPosIndex,
          turnState: {
            positionKey: nextPosKey,
            positionNameAr: POSITION_NAMES_AR[nextPosKey],
            briefcases: newBriefcases,
            pickedBriefcaseIndex: null,
            pickNumber: 0,
            status: 'waiting_pick_1'
          }
        });
      }
    }, 3500);
  },

  startMatchSimulation(roomId, roomState) {
    const roomRef = db.ref('dond_rooms/' + roomId);

    // Power calculations — team rating average, boosted by helper card + a
    // per-match energy roll (freshness on the day, not a persisted stat)
    const calcPower = (squad, helper) => {
      let r = 0;
      ['GK', 'DEF', 'MID', 'ATT', 'MGR'].forEach(k => { r += (squad[k]?.rating || 80); });
      let p = r / 5;
      if (helper && helper.id === 'protection') p += 3;
      return p;
    };

    const hostEnergy = 0.9 + Math.random() * 0.15;   // 0.90–1.05, ephemeral per match
    const guestEnergy = 0.9 + Math.random() * 0.15;
    const hostPower = calcPower(roomState.host.squad, roomState.host.helperCard) * hostEnergy;
    const guestPower = calcPower(roomState.guest.squad, roomState.guest.helperCard) * guestEnergy;

    let hostGoals = 0;
    let guestGoals = 0;
    const events = [];
    const minutes = [8, 19, 34, 48, 62, 75, 84, 92];
    const shotTypes = ['صاروخية لا تُصد ولا تُرَد', 'مقوسة R2 في زاوية مستحيلة', 'رأسية متقنة بارتقاء خرافي', 'تسديدة أرضية زاحفة على يمين الحارس', 'ركلة جزاء محكمة في الشباك'];

    // Outcome shares that don't hinge on goalkeeper skill — save% is computed
    // per-event below from the actual GK-vs-shooter rating gap.
    const MISS_CHANCE = 0.17;
    const CARD_CHANCE = 0.10;
    const VAR_CHANCE = 0.08;
    const BASE_SAVE = 0.30;
    const GK_WEIGHT = 0.01; // each rating point of (GK - shooter) swings save% by 1pt

    minutes.forEach((minute, index) => {
      const isHostAttacking = Math.random() * (hostPower + guestPower) < hostPower;
      const attacker = isHostAttacking ? roomState.host : roomState.guest;
      const defender = isHostAttacking ? roomState.guest : roomState.host;
      const attShooter = (Math.random() < 0.6) ? attacker.squad.ATT : attacker.squad.MID;
      const assistPlayer = (attShooter === attacker.squad.ATT) ? attacker.squad.MID : attacker.squad.DEF;
      const defGK = defender.squad.GK;
      const shotStyle = shotTypes[Math.floor(Math.random() * shotTypes.length)];

      let saveChance = BASE_SAVE + ((defGK?.rating || 80) - (attShooter?.rating || 80)) * GK_WEIGHT;
      saveChance = Math.max(0.08, Math.min(0.70, saveChance));
      const goalChance = Math.max(0.05, 1 - saveChance - MISS_CHANCE - CARD_CHANCE - VAR_CHANCE);

      const rand = Math.random();

      if (rand < goalChance) {
        if (isHostAttacking) hostGoals++; else guestGoals++;
        events.push({
          minute,
          type: 'GOAL',
          text: `⚽ GOALLL!! ${attShooter.name} يسجل هدفاً عالمياً! ${shotStyle}! (تمريرة حاسمة: ${assistPlayer?.name || 'مجهود فردي'})`,
          score: `${hostGoals} - ${guestGoals}`
        });
      } else if (rand < goalChance + saveChance) {
        events.push({
          minute,
          type: 'SAVE',
          text: `🧤 تصدي خيالي! الحارس العملاق ${defGK.name} يرتمي بأطراف أصابعه ويبعد تسديدة ${attShooter.name}!`,
          score: `${hostGoals} - ${guestGoals}`
        });
      } else if (rand < goalChance + saveChance + MISS_CHANCE) {
        events.push({
          minute,
          type: 'MISS',
          text: `💥 القائم ينوب عن الحارس! تسديدة ${attShooter.name} تصطدم بالقائم وسط ذهول الجميع!`,
          score: `${hostGoals} - ${guestGoals}`
        });
      } else if (rand < goalChance + saveChance + MISS_CHANCE + CARD_CHANCE) {
        events.push({
          minute,
          type: 'CARD',
          text: `🟨 بطاقة صفراء! الحكم يوجه إنذاراً للمدافع ${defender.squad.DEF.name} بعد تدخل قوي لتوقيف خطورة ${attShooter.name}!`,
          score: `${hostGoals} - ${guestGoals}`
        });
      } else {
        events.push({
          minute,
          type: 'VAR',
          text: `🖥️ تقنية الـ VAR تفحص التدخل على ${attShooter.name}... الحكم يشير بمنح ركلة حرة واعدة!`,
          score: `${hostGoals} - ${guestGoals}`
        });
      }
    });

    const hostPossession = Math.round((hostPower / (hostPower + guestPower)) * 100);

    // MVP Determination
    const allPlayers = [
      ...Object.values(roomState.host.squad).filter(Boolean),
      ...Object.values(roomState.guest.squad).filter(Boolean)
    ];
    const mvpPlayer = allPlayers.sort((a, b) => b.rating - a.rating)[0] || { name: 'المستضيف', rating: 90 };

    const matchSim = {
      status: 'simulating',
      currentTime: 0,
      hostGoals,
      guestGoals,
      events,
      mvpPlayer,
      stats: {
        possession: [hostPossession, 100 - hostPossession],
        shots: [Math.floor(hostPower / 10), Math.floor(guestPower / 10)],
        shotsOnTarget: [hostGoals + 2, guestGoals + 2]
      }
    };

    roomRef.update({
      status: 'simulating',
      matchSimulation: matchSim
    });

    // Run 10-second ticker on host client
    if (roomState.host.id === myPlayerId) {
      let sec = 0;
      const interval = setInterval(() => {
        sec++;
        const timeVal = Math.min(sec * 9, 90);
        roomRef.child('matchSimulation/currentTime').set(timeVal);

        if (sec >= 10) {
          clearInterval(interval);
          let winner = 'draw';
          if (hostGoals > guestGoals) winner = 'host';
          else if (guestGoals > hostGoals) winner = 'guest';

          roomRef.update({
            status: 'finished',
            'matchSimulation/status': 'finished',
            winner: winner
          });
        }
      }, 1000);
    }
  },

  confirmLineupReady(roomId, roomState) {
    const roomRef = db.ref('dond_rooms/' + roomId);
    roomRef.child('lineupReady').transaction(current => current ? current : true)
      .then(result => {
        if (result.committed && roomState.host.id === myPlayerId) {
          // Only the host client actually starts the simulation (matches ticker ownership below)
          this.startMatchSimulation(roomId, roomState);
        }
      });
  },

  requestSteal(roomId, roomState, myPos, oppPos) {
    // Restricted to the lineup-reveal screen: both squads are complete there,
    // and the match outcome is pre-computed synchronously once simulation starts.
    if (roomState.status !== 'lineup') return;
    if (myPos !== oppPos) return; // same-position swap only, keeps squads structurally valid
    const isHost = roomState.host.id === myPlayerId;
    const myKey = isHost ? 'host' : 'guest';
    const oppKey = isHost ? 'guest' : 'host';
    const me = roomState[myKey];
    const opp = roomState[oppKey];
    if (!me || !opp) return;
    if (!me.helperCard || me.helperCard.id !== 'steal') return;
    if (opp.protectedPos && opp.protectedPos === oppPos) return; // shielded by درع الحماية
    const givenPlayer = me.squad[myPos];
    const takenPlayer = opp.squad[oppPos];
    if (!givenPlayer || !takenPlayer) return;

    const roomRef = db.ref('dond_rooms/' + roomId);
    const updates = {};
    updates[`${myKey}/squad/${myPos}`] = takenPlayer;
    updates[`${oppKey}/squad/${oppPos}`] = givenPlayer;
    updates[`${myKey}/helperCard`] = null;

    return roomRef.update(updates).then(() => {
      this.notify(roomId, {
        kind: 'steal',
        text: `🥷 تم سرقة ${takenPlayer.name} منك واستبداله بـ ${givenPlayer.name}!`
      });
    });
  },

  setProtection(roomId, roomState, posKey) {
    // Usable on the lineup-reveal screen, before the opponent can steal: shields
    // one of your own players so requestSteal refuses to take them.
    if (roomState.status !== 'lineup') return;
    const isHost = roomState.host.id === myPlayerId;
    const myKey = isHost ? 'host' : 'guest';
    const me = roomState[myKey];
    if (!me || !me.helperCard || me.helperCard.id !== 'protection') return;
    if (!me.squad[posKey]) return;

    const roomRef = db.ref('dond_rooms/' + roomId);
    roomRef.child(myKey + '/protectedPos').set(posKey);
    this.notify(roomId, {
      kind: 'protection',
      text: `🛡️ ${me.name} حمى ${me.squad[posKey].name} من السرقة!`
    });
  },

  useRandomPick(roomId, roomState) {
    // Usable right before picking (waiting_pick_1): instantly assigns a random
    // one of the 4 current cards, skipping the manual pick/deal flow entirely.
    if (roomState.turnState.status !== 'waiting_pick_1') return;
    const isHost = roomState.currentTurn === 'host';
    const activePlayer = isHost ? roomState.host : roomState.guest;
    if (!activePlayer?.helperCard || activePlayer.helperCard.id !== 'random_pick') return;
    const idx = Math.floor(Math.random() * roomState.turnState.briefcases.length);
    this.finalizeSelection(roomId, roomState, roomState.turnState.briefcases[idx], 'random_pick');
  },

  useFreePick(roomId, roomState) {
    // Reveals all 4 cards face-up so the active player can pick whichever
    // one they actually want (see confirmFreePick).
    if (roomState.turnState.status !== 'waiting_pick_1') return;
    const isHost = roomState.currentTurn === 'host';
    const activePlayer = isHost ? roomState.host : roomState.guest;
    if (!activePlayer?.helperCard || activePlayer.helperCard.id !== 'free_pick') return;
    const revealedBriefcases = roomState.turnState.briefcases.map(b => ({ ...b, isRevealed: true }));
    const roomRef = db.ref('dond_rooms/' + roomId);
    roomRef.child('turnState').update({ briefcases: revealedBriefcases, status: 'free_pick_active' });
  },

  confirmFreePick(roomId, roomState, briefcaseIndex) {
    if (roomState.turnState.status !== 'free_pick_active') return;
    const briefcase = roomState.turnState.briefcases[briefcaseIndex];
    if (!briefcase) return;
    this.finalizeSelection(roomId, roomState, briefcase, 'free_pick');
  },

  dumpOnOpponent(roomId, roomState) {
    // Usable right when you reveal a player you don't want, at the same
    // decision point as Deal/No Deal: forces that player onto the OPPONENT's
    // squad for this position (they skip their own pick for it), then gives
    // the active player a fresh pick for the same position instead.
    if (!['picked_1_pending_deal', 'picked_2_pending_deal'].includes(roomState.turnState.status)) return;
    const isHost = roomState.currentTurn === 'host';
    const activeKey = isHost ? 'host' : 'guest';
    const oppKey = isHost ? 'guest' : 'host';
    const activePlayer = roomState[activeKey];
    const opp = roomState[oppKey];
    if (!opp) return;
    if (!activePlayer.helperCard || activePlayer.helperCard.id !== 'force_pick') return;

    const posKey = POSITIONS[roomState.positionIndex];
    const briefcase = roomState.turnState.briefcases[roomState.turnState.pickedBriefcaseIndex];
    if (!briefcase || !briefcase.item) return;

    const roomRef = db.ref('dond_rooms/' + roomId);
    const newOppSquad = { ...opp.squad, [posKey]: briefcase.item };
    const allRevealed = roomState.turnState.briefcases.map(b => ({ ...b, isRevealed: true }));

    roomRef.child(oppKey).update({ squad: newOppSquad });
    roomRef.child(activeKey + '/helperCard').set(null);
    roomRef.child('turnState/briefcases').set(allRevealed);

    this.notify(roomId, {
      kind: 'dump',
      text: `🎯 ${activePlayer.name} أجبر ${opp.name} ياخد ${briefcase.item.name} في مركز ${POSITION_NAMES_AR[posKey]}! و${activePlayer.name} بياخد فرصة يختار لاعب تاني.`
    });

    setTimeout(() => {
      const newBriefcases = generateBriefcases(posKey, false);
      roomRef.child('turnState').set({
        positionKey: posKey,
        positionNameAr: POSITION_NAMES_AR[posKey],
        briefcases: newBriefcases,
        pickedBriefcaseIndex: null,
        pickNumber: 0,
        status: 'waiting_pick_1',
        dumpedThisPosition: true
      });
    }, 3500);
  },

  sendEmoji(roomId, emojiSymbol) {
    if (!roomId) return;
    const roomRef = db.ref('dond_rooms/' + roomId);
    roomRef.child('lastEmoji').set({
      symbol: emojiSymbol,
      senderId: myPlayerId,
      timestamp: Date.now()
    });
  },

  notify(roomId, notification) {
    if (!roomId) return;
    const roomRef = db.ref('dond_rooms/' + roomId);
    roomRef.child('lastNotification').set({
      ...notification,
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      senderId: myPlayerId,
      timestamp: Date.now()
    });
  },

  restartGame(roomId) {
    const roomRef = db.ref('dond_rooms/' + roomId);
    roomRef.update({
      status: 'drafting',
      currentTurn: 'host',
      positionIndex: 0,
      'host/squad': { GK: null, DEF: null, MID: null, ATT: null, MGR: null },
      'host/helperCard': null,
      'host/protectedPos': null,
      'guest/squad': { GK: null, DEF: null, MID: null, ATT: null, MGR: null },
      'guest/helperCard': null,
      'guest/protectedPos': null,
      turnState: {
        positionKey: 'GK',
        positionNameAr: POSITION_NAMES_AR['GK'],
        briefcases: generateBriefcases('GK', false),
        pickedBriefcaseIndex: null,
        pickNumber: 0,
        status: 'waiting_pick_1'
      },
      matchSimulation: null,
      lineupReady: null
    });
  }
};

window.FirebaseEngine = FirebaseEngine;
