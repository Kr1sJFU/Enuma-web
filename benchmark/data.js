// Draft structure follows the supplied technical report, Section 5.3 and Table 5.
// null means not yet reported. Never use 0 to represent a missing score.
window.ENUMA_BENCH = {
  categories: [
    {id:'navigation',label:'Navigation',short:'Navigation',group:'interactive',description:'Adherence to user-specified camera motion through the generated world.'},
    {id:'text_event',label:'Text Event',short:'Text event',group:'interactive',description:'Whether a language-specified event occurs with the intended semantics and timing.'},
    {id:'subject_action',label:'Subject Action',short:'Subject action',group:'interactive',description:'Whether scene entities perform the instructed behaviors.'},
    {id:'human_reference',label:'Human Reference',short:'Human ref.',group:'reference',description:'Preservation of identity and appearance from a human reference.'},
    {id:'scene_reference',label:'Scene Reference',short:'Scene ref.',group:'reference',description:'Consistency between the generated environment and an external scene reference.'},
    {id:'reference_event',label:'Reference Event',short:'Ref. event',group:'reference',description:'Faithful instantiation of a referenced entity at the designated event time.'}
  ],
  models: [
    {name:'JoyAI-Echo-1.5 (Bi)',scores:{}},
    {name:'JoyAI-Echo-1.5 (Flash)',scores:{}},
    {name:'AlayaWorld',scores:{}},
    {name:'Alaya-EVOKE',scores:{}},
    {name:'LingBot-World v2',scores:{}},
    {name:'SANA-WM',scores:{}},
    {name:'ENUMA-Bi',ours:true,scores:{}},
    {name:'ENUMA-Fast',ours:true,scores:{}}
  ],
  examples: [
    {id:'ringworld',category:'navigation',title:'Into the ringworld',asset:'world',description:'Camera-conditioned exploration of a ringworld. Existing ENUMA showcase footage, used only to preview the gallery layout.'},
    {id:'day-to-night',category:'text_event',title:'From daylight to nightfall',asset:'language',description:'A language-driven change from day to night. Existing ENUMA showcase footage, used only to preview the gallery layout.'},
    {id:'cow-lift',category:'subject_action',title:'A different next step',asset:'lift',description:'An object interaction sample: lift the cow. Existing ENUMA showcase footage, used only to preview the gallery layout.'},
    {id:'neon-metropolis',category:'scene_reference',title:'A reference becomes a world',asset:'reference',description:'Character and scene references guide exploration in an anime metropolis. Existing ENUMA showcase footage, used only to preview the gallery layout.'}
  ]
};
