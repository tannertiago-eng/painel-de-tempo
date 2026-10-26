// Painel de Tempo · ConsultPRO
// Ponte entre a sua Google Agenda e o painel. Só lê a agenda, não muda nada nela.
// Passo a passo em https://tannertiago-eng.github.io/painel-de-tempo/
// O endereço que o Google gerar funciona como senha: quem tiver ele vê os compromissos. Não publique.

const CONFIG = {
  // Agendas lidas. 'primary' é a sua principal. Para outras, use o "ID da agenda"
  // (Configurações da agenda > Integrar agenda), ex.: 'abc123@group.calendar.google.com'.
  AGENDAS: ['primary'],
  // Quantos dias à frente o painel recebe (para mostrar o próximo compromisso).
  DIAS: 8,
  // true = o painel mostra só "Ocupado" no lugar do título e da descrição (bom para agenda pessoal).
  SO_OCUPADO: false
};

// Cores de evento do Google Agenda (as 11 da paleta), no tom usado pelo próprio Google.
const CORES = {
  '1': '#7986CB', '2': '#33B679', '3': '#8E24AA', '4': '#E67C73', '5': '#F6BF26', '6': '#F4511E',
  '7': '#039BE5', '8': '#616161', '9': '#3F51B5', '10': '#0B8043', '11': '#D50000'
};

// Cores de agenda: o Google devolve a paleta antiga; aqui vira o tom que a Agenda mostra hoje.
const CORES_AGENDA = {
  '#AC725E': '#795548', '#D06B64': '#E67C73', '#F83A22': '#D50000', '#FA573C': '#F4511E',
  '#FF7537': '#EF6C00', '#FFAD46': '#F09300', '#42D692': '#009688', '#16A765': '#0B8043',
  '#7BD148': '#7CB342', '#B3DC6C': '#C0CA33', '#FBE983': '#E4C441', '#FAD165': '#F6BF26',
  '#92E1C0': '#33B679', '#9FE1E7': '#039BE5', '#9FC6E7': '#4285F4', '#4986E7': '#3F51B5',
  '#9A9CFF': '#7986CB', '#B99AFF': '#B39DDB', '#C2C2C2': '#616161', '#CABDBF': '#A79B8E',
  '#CCA6AC': '#AD1457', '#F691B2': '#D81B60', '#CD74E6': '#8E24AA', '#A47AE2': '#9E69AF'
};

function doGet(e) {
  const p = (e && e.parameter) || {};
  let corpo;
  try {
    corpo = { ok: true, gerado: new Date().toISOString(), fuso: Session.getScriptTimeZone(), eventos: lerEventos() };
  } catch (err) {
    corpo = { ok: false, erro: String(err && err.message || err), eventos: null };
  }
  const json = JSON.stringify(corpo);
  // ?callback=nome devolve como script (JSONP): o painel lê até aberto direto do computador
  if (p.callback && /^[A-Za-z_$][\w$]{0,60}$/.test(p.callback)) {
    return ContentService.createTextOutput(p.callback + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function lerEventos() {
  const ini = new Date(); ini.setHours(0, 0, 0, 0);
  const fim = new Date(ini.getTime() + CONFIG.DIAS * 86400000);
  const eventos = [];
  CONFIG.AGENDAS.forEach(id => {
    const agenda = id === 'primary' ? CalendarApp.getDefaultCalendar() : CalendarApp.getCalendarById(id);
    if (!agenda) return;                                                 // agenda sem acesso não derruba as outras
    const corDaAgenda = CORES_AGENDA[String(agenda.getColor()).toUpperCase()] || agenda.getColor();
    agenda.getEvents(ini, fim).forEach(ev => {
      if (ev.isAllDayEvent()) return;                                    // dia inteiro não vira bloco
      try { if (ev.getMyStatus() === CalendarApp.GuestStatus.NO) return; } catch (_) {}   // recusado não aparece
      eventos.push({
        titulo: CONFIG.SO_OCUPADO ? 'Ocupado' : (ev.getTitle() || 'Sem título'),
        inicio: ev.getStartTime().toISOString(),
        fim: ev.getEndTime().toISOString(),
        descricao: CONFIG.SO_OCUPADO ? '' : (ev.getDescription() || ''),
        cor: CORES[ev.getColor()] || corDaAgenda
      });
    });
  });
  return eventos.sort((a, b) => a.inicio < b.inicio ? -1 : 1);
}

// Opcional: rode pelo editor para ver o que o painel vai receber.
function testar() {
  const eventos = lerEventos();
  console.log(eventos.length + ' compromissos nos próximos ' + CONFIG.DIAS + ' dias');
  eventos.slice(0, 5).forEach(e => console.log(e.inicio + '  ' + e.titulo));
}
