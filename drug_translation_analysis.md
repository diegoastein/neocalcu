# Análisis de Traducción de Medicamentos (NeoCalcu)

Este documento lista todos los medicamentos definidos en [clinical_knowledge.json](file:///home/diegosteinberg/neocalcu/docs/clinical_knowledge.json) para identificar cuáles están en inglés o requieren traducción al español.

## Resumen
- **Total de medicamentos:** 224
- **Medicamentos potencialmente en inglés:** 55

## Lista Completa de Medicamentos

La siguiente tabla detalla todos los medicamentos del archivo. Los marcados con **Sí** en la columna **¿Potencialmente Inglés?** han sido detectados automáticamente.

| # | ID | Nombre en JSON | Categoría | ¿Potencialmente Inglés? | Propuesta de Traducción (si aplica) |
|---|----|----------------|-----------|-------------------------|-------------------------------------|
| 1 | `ampicilina` | Ampicilina | antibiotico | 🟢 No |  |
| 2 | `gentamicina` | Gentamicina | antibiotico | 🟢 No |  |
| 3 | `vancomicina` | Vancomicina | antibiotico | 🟢 No |  |
| 4 | `amikacina` | Amikacina | antibiotico | 🟢 No |  |
| 5 | `cefotaxima` | Cefotaxima | antibiotico | 🟢 No |  |
| 6 | `meropenem` | Meropenem | antibiotico | 🟢 No |  |
| 7 | `aciclovir` | Aciclovir | antiviral | 🟢 No |  |
| 8 | `fluconazol` | Fluconazol | antifungico | 🟢 No |  |
| 9 | `dopamina` | Dopamina | cardiovascular | 🟢 No |  |
| 10 | `dobutamina` | Dobutamina | cardiovascular | 🟢 No |  |
| 11 | `adrenalina_infusion` | Adrenalina (infusión) | cardiovascular,emergencia | 🟢 No |  |
| 12 | `adrenalina_reanimacion` | Adrenalina (reanimación) | emergencia | 🟢 No |  |
| 13 | `morfina` | Morfina | analgesico_sedante | 🟢 No |  |
| 14 | `fentanilo` | Fentanilo | analgesico_sedante | 🟢 No |  |
| 15 | `midazolam` | Midazolam | analgesico_sedante | 🟢 No |  |
| 16 | `fenobarbital` | Fenobarbital | analgesico_sedante | 🟢 No |  |
| 17 | `cafeina_citrato` | Cafeína citrato | respiratorio | 🟢 No |  |
| 18 | `surfactante_beractant` | Surfactante Beractant | respiratorio,surfactante | 🟢 No |  |
| 19 | `surfactante_poractant` | Surfactante Poractant | respiratorio,surfactante | 🟢 No |  |
| 20 | `surfactante_babyfact` | Surfactante Baby Fact B | respiratorio,surfactante | 🔴 **Sí** | Surfactante Babia Fact B |
| 21 | `furosemida` | Furosemida | diuretico | 🟢 No |  |
| 22 | `indometacina` | Indometacina | cardiovascular | 🟢 No |  |
| 23 | `gluconato_calcio` | Gluconato de calcio 10% | vitaminas_electrolitos,emergencia | 🟢 No |  |
| 24 | `bicarbonato_sodio` | Bicarbonato de sodio 8.4% | emergencia,vitaminas_electrolitos | 🟢 No |  |
| 25 | `vitamina_k1` | Vitamina K1 | vitaminas_electrolitos | 🟢 No |  |
| 26 | `naloxona` | Naloxona | emergencia | 🟢 No |  |
| 27 | `alprostadil` | Alprostadil (PGE1) | cardiovascular | 🟢 No |  |
| 28 | `acetaminophen` | Acetaminofeno | analgesic,antipyretic | 🟢 No |  |
| 29 | `acetazolamida` | Acetazolamida | diuretic,carbonic_anhydrase_inhibitor | 🟢 No |  |
| 30 | `adenosina` | Adenosina | antiarrhythmic | 🟢 No |  |
| 31 | `albumina` | Albumina | colloid,plasma_expander | 🟢 No |  |
| 32 | `albuterol` | Albuterol | bronchodilator,beta2_agonist | 🟢 No |  |
| 33 | `alteplase` | Alteplasa | thrombolytic | 🟢 No |  |
| 34 | `aminocaproico` | Ácido aminocaproico | fibrinolysis_inhibitor | 🟢 No |  |
| 35 | `aminofilina` | Aminofilina | bronchodilator,theophylline | 🟢 No |  |
| 36 | `amiodarona` | Amiodarona | antiarrhythmic | 🟢 No |  |
| 37 | `amoxicilina` | Amoxicilina | antibiotic,penicillin | 🟢 No |  |
| 38 | `anfotericina_b_lipid` | Anfotericina B Complejo Lipídico | antifungal | 🟢 No |  |
| 39 | `anfotericina_b_liposomal` | Anfotericina B Liposomal | antifungal | 🟢 No |  |
| 40 | `anfotericina_b_convencional` | Anfotericina B | antifungal | 🟢 No |  |
| 41 | `anidulafungina` | Anidulafungina | antifungal,echinocandin | 🟢 No |  |
| 42 | `arginina` | Arginina | amino_acid,supplement | 🟢 No |  |
| 43 | `acido_ascorbico` | Ácido Ascórbico | vitamin,antioxidant | 🟢 No |  |
| 44 | `aspirina` | Aspirina | nsaid,antiplatelet | 🟢 No |  |
| 45 | `atropina` | Atropina | anticholinergic | 🟢 No |  |
| 46 | `azitromicina` | Azitromicina | antibiotic,macrolide | 🟢 No |  |
| 47 | `aztreonam` | Aztreonam | antibiotic,beta_lactam | 🟢 No |  |
| 48 | `beractanto` | Beractanto | pulmonary_surfactant | 🟢 No |  |
| 49 | `bevacizumab` | Bevacizumab | monoclonal_antibody,antiangiogenic | 🟢 No |  |
| 50 | `bumetanida` | Bumetanida | loop_diuretic | 🟢 No |  |
| 51 | `bupivacaina` | Bupivacaína | local_anesthetic | 🟢 No |  |
| 52 | `buprenorfina` | Buprenorfina | opioid | 🟢 No |  |
| 53 | `caspofungina` | Caspofungina | antifungico | 🟢 No |  |
| 54 | `cefazolina` | Cefazolina | antibiotico | 🟢 No |  |
| 55 | `cefepima` | Cefepima | antibiotico | 🟢 No |  |
| 56 | `ceftazidima` | Ceftazidima | antibiotico | 🟢 No |  |
| 57 | `ceftriaxona` | Ceftriaxona | antibiotico | 🟢 No |  |
| 58 | `cefoxitina` | Cefoxitina | antibiotico | 🟢 No |  |
| 59 | `chloral_hydrate` | Hidrato de Cloral | sedante | 🟢 No |  |
| 60 | `cimetidina` | Cimetidina | gastrointestinal | 🟢 No |  |
| 61 | `claritromicina` | Claritromicina | antibiotico | 🟢 No |  |
| 62 | `clindamicina` | Clindamicina | antibiotico | 🟢 No |  |
| 63 | `clopidogrel` | Clopidogrel | antiplatelet | 🟢 No |  |
| 64 | `colistina` | Colistina | antibiotico | 🟢 No |  |
| 65 | `cosintropina` | Cosintropina | endocrino | 🟢 No |  |
| 66 | `dexametasona` | Dexametasona | corticosteroide | 🟢 No |  |
| 67 | `dextrosa` | Dextrosa | nutricion | 🟢 No |  |
| 68 | `diazoxide` | Diazóxido | antihipertensivo | 🟢 No |  |
| 69 | `didanosina` | Didanosina | antiviral | 🟢 No |  |
| 70 | `digoxina` | Digoxina | cardiovascular | 🟢 No |  |
| 71 | `dornasa_alfa` | Dornasa Alfa | pulmonar | 🟢 No |  |
| 72 | `doxiciclina` | Doxiciclina | antibiotico | 🟢 No |  |
| 73 | `enalapril` | Enalapril | antihipertensivo | 🟢 No |  |
| 74 | `enoxaparina` | Enoxaparina | anticoagulante | 🟢 No |  |
| 75 | `epoetina` | Epoetina Alfa | hematologico | 🟢 No |  |
| 76 | `eritromicina` | Eritromicina | antibiotico | 🟢 No |  |
| 77 | `esomeprazol` | Esomeprazol | gastrointestinal | 🟢 No |  |
| 78 | `famotidina` | Famotidina | gastrointestinal | 🟢 No |  |
| 79 | `ferrous_sulfate` | Sulfato Ferroso | hematologico | 🔴 **Sí** | Sulgrasao Ferroso |
| 80 | `floppy_fecal` | Fecal (Microorganismo) | gastrointestinal | 🟢 No |  |
| 81 | `foscarnet` | Foscarnet | antiviral | 🟢 No |  |
| 82 | `ganciclovir` | Ganciclovir | antiviral | 🟢 No |  |
| 83 | `glutamina` | Glutamina | amino_acid | 🟢 No |  |
| 84 | `heparina` | Heparina | anticoagulante | 🟢 No |  |
| 85 | `imunoglobulina_hepatitis_b` | Inmunoglobulina Hepatitis B | inmunologico | 🔴 **Sí** | Inmunoglobulinaa Hepatitis B |
| 86 | `imunoglobulina_varicela` | Inmunoglobulina Varicela Zóster | inmunologico | 🔴 **Sí** | Inmunoglobulinaa Varicela Zóster |
| 87 | `imunoglobulina_human` | Inmunoglobulina Humana | inmunologico | 🔴 **Sí** | Inmunoglobulinaa Humanoa |
| 88 | `insulina` | Insulina | endocrino | 🟢 No |  |
| 89 | `ipratropio` | Ipratropio | broncodilatador | 🟢 No |  |
| 90 | `isoproterenol` | Isoproterenol | broncodilatador | 🟢 No |  |
| 91 | `kanamicina` | Kanamicina | antibiotico | 🟢 No |  |
| 92 | `lanoconazol` | Lanoconazol | antifungico | 🟢 No |  |
| 93 | `levotitroxina` | Levotiroxina | endocrino | 🟢 No |  |
| 94 | `lidocaina_antiarritmico` | Lidocaína (antiarrítmico) | antiarritmico | 🟢 No |  |
| 95 | `lindano` | Lindano | parasitario | 🟢 No |  |
| 96 | `linezolid` | Linezolid | antibiotico | 🟢 No |  |
| 97 | `lorazepam` | Lorazepam | sedante | 🟢 No |  |
| 98 | `lucinactante` | Lucinactante | respiratorio,surfactante | 🟢 No |  |
| 99 | `magnesio_sulfato` | Sulfato de Magnesio | vitaminas_electrolitos | 🔴 **Sí** | Sulgrasao De Magnesio |
| 100 | `manitol` | Manitol | diuretico | 🟢 No |  |
| 101 | `metadona` | Metadona | opioid | 🟢 No |  |
| 102 | `metacolpramida` | Metoclopramida | gastrointestinal | 🟢 No |  |
| 103 | `metronidazol` | Metronidazol | antibiotico | 🟢 No |  |
| 104 | `micafungina` | Micafungina | antifungico | 🟢 No |  |
| 105 | `milrinone` | Milrinona | cardiovascular | 🟢 No |  |
| 106 | `moxifloxacina` | Moxifloxacina | antibiotico | 🟢 No |  |
| 107 | `mupirocin` | Mupirocina | antibiotico_topico | 🟢 No |  |
| 108 | `nafcilina` | Nafcilina | antibiotico | 🟢 No |  |
| 109 | `neomicina` | Neomicina | antibiotico | 🟢 No |  |
| 110 | `nelfinavir` | Nelfinavir | antiviral | 🟢 No |  |
| 111 | `netilmicina` | Netilmicina | antibiotico | 🟢 No |  |
| 112 | `nevirapina` | Nevirapina | antiviral | 🟢 No |  |
| 113 | `niacina` | Niacina | vitaminas_electrolitos | 🟢 No |  |
| 114 | `nicardipina` | Nicardipina | antihipertensivo | 🟢 No |  |
| 115 | `nifedipina` | Nifedipina | antihipertensivo | 🟢 No |  |
| 116 | `nimo_dikine` | Nimo-Dikine (Nimorazol/Dikine) | antiparasitario | 🔴 **Sí** | Nimo-dikina (nimorazol/dikina) |
| 117 | `nitric_oxide` | Óxido Nítrico | respiratorio | 🟢 No |  |
| 118 | `nitroprusiato` | Nitroprusiato de Sodio | antihipertensivo | 🟢 No |  |
| 119 | `norepinefrina` | Norepinefrina | cardiovascular | 🟢 No |  |
| 120 | `nystatin` | Nistatina | antifungico | 🟢 No |  |
| 121 | `octreotido` | Octreotido | endocrino | 🟢 No |  |
| 122 | `omeprazol` | Omeprazol | gastrointestinal | 🟢 No |  |
| 123 | `ondansetron` | Ondansetrón | gastrointestinal | 🟢 No |  |
| 124 | `oxacilina` | Oxacilina | antibiotico | 🟢 No |  |
| 125 | `oxigeno` | Oxígeno | respiratorio | 🟢 No |  |
| 126 | `palifizumab` | Palivizumab | inmunologico | 🟢 No |  |
| 127 | `pancuronio` | Pancuronio | bloqueador_neuromuscular | 🟢 No |  |
| 128 | `pantoprazol` | Pantoprazol | gastrointestinal | 🟢 No |  |
| 129 | `papaverina` | Papaverina | vasodilatador | 🟢 No |  |
| 130 | `penicilina_g_benzatina` | Penicilina G Benzatina | antibiotico | 🟢 No |  |
| 131 | `penicilina_g_procaina` | Penicilina G Procaína | antibiotico | 🟢 No |  |
| 132 | `penicilina_g_aquosa` | Penicilina G Acuosa | antibiotico | 🟢 No |  |
| 133 | `pentobarbital` | Pentobarbital | sedante | 🟢 No |  |
| 134 | `fenitoina` | Fenitoína | anticonvulsivante | 🟢 No |  |
| 135 | `fentolamina` | Fentolamina | antihipertensivo | 🟢 No |  |
| 136 | `flumazenil` | Flumazenil | antidoto | 🟢 No |  |
| 137 | `florastor` | FloraStore (Saccharomyces) | probiotico | 🟢 No |  |
| 138 | `folic_acid` | Ácido Fólico | vitaminas_electrolitos | 🟢 No |  |
| 139 | `fosphenytoin` | Fosfenitoína | anticonvulsivante | 🟢 No |  |
| 140 | `acetylcysteine` | Acetylcysteine | antidote,mucolytic | 🔴 **Sí** | Acetilcisteína |
| 141 | `calcium_chloride` | Calcium chloride | electrolyte | 🔴 **Sí** | Cloruro de Calcio |
| 142 | `calcium_oral` | Calcium - Oral | electrolyte | 🔴 **Sí** | Calcio Oral |
| 143 | `calfactant` | Calfactant | pulmonar | 🟢 No |  |
| 144 | `captopril` | Captopril | cardiovascular | 🟢 No |  |
| 145 | `carglumic_acid` | Carglumic Acid | metabolic | 🔴 **Sí** | Ácido Carglúmico |
| 146 | `chloramphenicol` | Chloramphenicol | antibiotico | 🟢 No |  |
| 147 | `chlorothiazide` | Chlorothiazide | diuretico | 🔴 **Sí** | Clorotiazida |
| 148 | `clonidine` | CloNIDine | cardiovascular | 🔴 **Sí** | Clonidina |
| 149 | `cyclopentolate_ophthalmic` | Cyclopentolate (Ophthalmic) | ophtalmico | 🔴 **Sí** | Ciclopentolato (Oftálmico) |
| 150 | `digoxin_immune_fab` | Digoxin Immune Fab (Ovine) | antidote | 🔴 **Sí** | Fab Inmune contra Digoxina (Ovino) |
| 151 | `emtricitabine` | Emtricitabine | antiviral | 🔴 **Sí** | Emtricitabina |
| 152 | `enalaprilat` | Enalaprilat | cardiovascular | 🟢 No |  |
| 153 | `epinephrine_expanded` | EPINEFrina (Adrenalina) | inotropico | 🟢 No |  |
| 154 | `esmolol` | Esmolol | cardiovascular | 🟢 No |  |
| 155 | `factor_ix_recombinant` | Factor IX (Recombinant) | coagulation | 🔴 **Sí** | Factor IX (Recombinante) |
| 156 | `factor_viia_recombinant` | Factor VIIa (recombinant) | coagulation | 🔴 **Sí** | Factor VIIa (Recombinante) |
| 157 | `factor_x_human` | Factor X Human | coagulation | 🔴 **Sí** | Factor X Humano |
| 158 | `factor_xiii_concentrate` | Factor XIII Concentrate Human | coagulation | 🔴 **Sí** | Concentrado de Factor XIII Humano |
| 159 | `fat_emulsion` | Fat Emulsion | nutrition | 🔴 **Sí** | Emulsión de Lípidos |
| 160 | `flecainide` | Flecainide | cardiovascular | 🔴 **Sí** | Flecainida |
| 161 | `flucytosine` | Flucytosine | antifungico | 🔴 **Sí** | Flucitosina |
| 162 | `glucagon` | Glucagon | metabolico | 🟢 No |  |
| 163 | `hepatitis_b_immune_globulin` | Hepatitis B Immune Globulin | immunobiologico | 🔴 **Sí** | Inmunoglobulina contra Hepatitis B |
| 164 | `hepatitis_b_vaccine` | Hepatitis B Vaccine | immunobiologico | 🔴 **Sí** | Vacuna contra Hepatitis B |
| 165 | `hib_hepatitis_b_combo` | Hib Conjugate/Hepatitis B Vaccine | immunobiologico | 🔴 **Sí** | Vacuna combinada Hib/Hepatitis B |
| 166 | `hyaluronidase` | Hyaluronidase | altro | 🟢 No |  |
| 167 | `hydralazine` | HydrALAZINE | cardiovascular | 🔴 **Sí** | Hidralazina |
| 168 | `hydrochlorothiazide` | HydroCHLORothiazide | diuretico | 🔴 **Sí** | Hidroclorotiazida |
| 169 | `hydrocortisone` | Hydrocortisone | corticosteroid | 🔴 **Sí** | Hidrocortisona |
| 170 | `ibuprofen` | Ibuprofen | nsaid | 🟢 No |  |
| 171 | `imipenem_cilastatin` | Imipenem/Cilastatin | antibiotico | 🟢 No |  |
| 172 | `immune_globulin_human` | Immune Globulin (Human) | immunoglobulina | 🔴 **Sí** | Inmunoglobulina Humana |
| 173 | `infuvite_pediatric` | INFUVITE Pediatric | vitamin | 🟢 No |  |
| 174 | `insulin_human_regular` | Insulin Human Regular | metabolico | 🔴 **Sí** | Insulina Humana Regular |
| 175 | `iron_dextran` | Iron Dextran | hematinico | 🟢 No |  |
| 176 | `lamivudine` | LamiVUDine | antiviral | 🔴 **Sí** | Lamivudina |
| 177 | `lansoprazole` | Lansoprazole | acidez | 🟢 No |  |
| 178 | `levetiracetam` | LevETIRAcetam | anticonvulsivo | 🟢 No |  |
| 179 | `lidocaine_antiarrhythmic` | Lidocaína - Antiarrítmico | cardiovascular | 🟢 No |  |
| 180 | `lidocaine_cns` | Lidocaína - Anestésico local | local_anesthetic | 🟢 No |  |
| 181 | `lidocaine_prilocaine` | Lidocaine/Prilocaine | local_anesthetic | 🔴 **Sí** | Lidocaína/Prilocaína |
| 182 | `lopinavir_ritonavir` | Lopinavir/Ritonavir | antiviral | 🟢 No |  |
| 183 | `mct_oil` | MCT Oil | nutrition | 🔴 **Sí** | Aceite MCT |
| 184 | `microlipid` | Microlipid | nutrition | 🟢 No |  |
| 185 | `multivitamin_drops` | Multivitamin Drops | vitamin | 🔴 **Sí** | Gotas Multivitamínicas |
| 186 | `neostigmine` | Neostigmine | neuromuscular | 🔴 **Sí** | Neostigmina |
| 187 | `oseltamivir` | Oseltamivir | antiviral | 🟢 No |  |
| 188 | `phenylephrine` | Phenylephrine | cardiovascular | 🔴 **Sí** | Fenilefrina |
| 189 | `piperacillin` | Piperacillin | antibiotico | 🟢 No |  |
| 190 | `piperacillin_tazobactam` | Piperacillin/Tazobactam | antibiotico | 🟢 No |  |
| 191 | `potassium_chloride` | Potassium chloride | electrolyte | 🔴 **Sí** | Cloruro de Potasio |
| 192 | `potassium_iodide` | Potassium iodide | otro | 🔴 **Sí** | Yoduro de Potasio |
| 193 | `procainamide` | Procainamide | cardiovascular | 🔴 **Sí** | Procainamida |
| 194 | `propranolol` | Propranolol | cardiovascular | 🟢 No |  |
| 195 | `protamine` | Protamine | antidote | 🔴 **Sí** | Protamina |
| 196 | `protein_c_concentrate` | Protein C Concentrate (Human) | coagulation | 🔴 **Sí** | Concentrado de Proteína C (Humana) |
| 197 | `pyridoxine` | Pyridoxine | vitamin | 🔴 **Sí** | Piridoxina |
| 198 | `quinupristin_dalfopristin` | Quinupristin/Dalfopristin | antibiotico | 🟢 No |  |
| 199 | `ranibizumab` | Ranibizumab | ophtalmico | 🟢 No |  |
| 200 | `ranitidine` | Ranitidine | acidez | 🔴 **Sí** | Ranitidina |
| 201 | `rifampin` | Rifampin | antibiotico | 🟢 No |  |
| 202 | `rocuronium` | Rocuronium | paralytic | 🟢 No |  |
| 203 | `sildenafil` | Sildenafil | cardiovascular | 🟢 No |  |
| 204 | `simetricone` | Simetricone | digestivo | 🔴 **Sí** | Simetricona |
| 205 | `sodium_chloride_09` | Sodium Chloride 0.9% | electrolyte,fluid | 🔴 **Sí** | Cloruro de Sodio 0.9% |
| 206 | `sodium_glycerophosphate` | Sodium Glycerophosphate | electrolyte | 🔴 **Sí** | Glicerofosfato de Sodio |
| 207 | `sodium_phenylacetate_benzoate` | Sodium phenylacetate/Sodium benzoate | metabolico | 🔴 **Sí** | Fenilacetato de Sodio / Benzoato de Sodio |
| 208 | `sotalol` | Sotalol | cardiovascular | 🟢 No |  |
| 209 | `spironolactone` | Spironolactone | diuretico | 🔴 **Sí** | Espironolactona |
| 210 | `succinylcholine` | Succinylcholine | paralytic | 🔴 **Sí** | Succinilcolina |
| 211 | `sucrose` | Sucrose | analgesico | 🟢 No |  |
| 212 | `tham_acetate` | THAM acetate | buffers | 🔴 **Sí** | Acetato de THAM |
| 213 | `ticarcillin_clavulanate` | Ticarcillin/Clavulanate | antibiotico | 🔴 **Sí** | Ticarcilina/Clavulanato |
| 214 | `tobramycin` | Tobramycin | antibiotico | 🟢 No |  |
| 215 | `topiramate` | Topiramate | anticonvulsivo | 🔴 **Sí** | Topiramato |
| 216 | `tropicamide_ophthalmic` | Tropicamide (Ophthalmic) | ophtalmico | 🔴 **Sí** | Tropicamida (Oftálmica) |
| 217 | `ursodiol` | Ursodiol | hepatico | 🟢 No |  |
| 218 | `valganciclovir` | ValGANciclovir | antiviral | 🟢 No |  |
| 219 | `vecuronium` | Vecuronium | paralytic | 🟢 No |  |
| 220 | `vitamin_a` | Vitamin A | vitamin | 🟢 No |  |
| 221 | `vitamin_d` | Vitamin D | vitamin | 🟢 No |  |
| 222 | `vitamin_e` | Vitamin E | vitamin | 🟢 No |  |
| 223 | `vitamin_k1` | Vitamin K1 | vitamin | 🟢 No |  |
| 224 | `zidovudine` | Zidovudine | antiviral | 🔴 **Sí** | Zidovudina |
