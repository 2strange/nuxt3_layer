// Vuetify 3 input rules. Use in setup():
//   const { emailRules, passRules } = useFormRules()
export function useFormRules() {
  return {
    emailRules: [
      (v) => !!v || 'E-Mail ist erforderlich!',
      (v) => /.+@.+\..+/.test(v) || 'E-Mail Format nicht korrekt!',
    ],
    passRules: [
      (v) => !!v || 'Passwort muss ausgefüllt werden!',
      (v) => String(v).length >= 8 || 'Mindestens 8 Zeichen!',
    ],
    fonRules: [
      (v) => !!v || 'Telefon ist erforderlich!',
      (v) =>
        (/^(\+|0)[0-9()]*$/.test(v) && String(v).length > 7 && String(v).length < 18) ||
        'Telefon Format nicht korrekt!',
    ],
    nameRules: [
      (v) => !!v || 'Name ist erforderlich!',
      (v) => (v && v.length <= 42) || 'Bitte nicht mehr als 42 Zeichen verwenden.',
    ],
    existRules: [(v) => !!v || 'Feld ist erforderlich!'],
    requiredRules: [(v) => !!v || 'Feld ist erforderlich!'],
    numberRules: [(v) => !isNaN(parseInt(v)) || 'Feld ist erforderlich!'],

    inputStyles: {
      variant: 'outlined',
      density: 'comfortable',
      validateOn: 'blur',
      color: 'primary',
    },
  }
}
