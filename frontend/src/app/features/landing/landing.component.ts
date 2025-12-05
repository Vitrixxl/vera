import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [],
  template: `
    <div class="flex flex-col w-full min-h-screen font-sans text-[#000000] bg-cover bg-center"
     style="background-image: url('/images/background.jpg')">
      
      <header class="flex-none px-6 py-4 border-b border-black flex justify-between items-center bg-transparent z-10">
        <img src="/images/vera-icon.png" alt="Vera Logo" class="h-8 w-auto">
      </header>

      <div class="px-4 mt-10 flex flex-col lg:px-16">
        <h2 class="text-2xl font-semibold font-[Lastik] md:text-left md:text-3xl lg:text-4xl">
          Vera, c’est quoi?
        </h2>
        <div class="flex items-center gap-4 mt-4 mb-14 w-full md:mt-6 md:mb-20 md:px-16 md:gap-8 md:flex-row justify-center md:h-48"> 
          <p class="text-xs text-gray-600 leading-relaxed max-w-[60%] md:text-left md:text-sm md:max-w-[50%] lg:text-base lg:max-w-[40%]"> 
            <span class="font-bold text-black">Ton gilet pare-balles contre les Fake News.</span> VERA est une IA de vérification instantanée. Elle analyse tes textes et images en temps réel en les croisant avec plus de 400 médias certifiés pour te dire si une info est Vraie, Fausse ou Incertaine. Fini le doute. 
          </p> 
          <img src="/images/statue.png" class="w-40 h-40 rounded-full object-cover shadow-md bg-black" /> 
        </div>
      </div>

      <div class="py-8 px-11 mb-14 lg:px-16 lg:py-12">
        <p class="text-center text-gray-700 text-sm lg:text-base">
          Connectée à <span class="font-bold text-sm text-black bg-[#FFDEE0] lg:text-base">+400 sources certifiées</span> (AFP, Reuters, Le Monde...)
        </p>
      </div>

      <div class="w-full bg-[#DBF9BE] py-8 px-6 gap-4 flex flex-col lg:px-16 lg:py-12">
        <h3 class="text-center text-2xl lg:text-3xl">Demande à Vera</h3>
        <div class="lg:flex lg:gap-4 lg:items-center">
          <input 
            type="text" 
            placeholder="Colle un lien, un texte ou pose une question..." 
            class="w-full px-6 py-4 rounded-full border bg-[#FFF9F9] border-[#111110] text-sm lg:flex-1 lg:text-base"
          />
          <button (click)="handleSubmit()" class="w-full bg-[#111110] text-white py-4 rounded-full mt-2 text-sm lg:w-48 lg:mt-0 lg:text-base">
            Scanner la vérité
          </button>
        </div>
      </div>

      <div class="py-14 px-6 flex flex-col gap-3 lg:px-16 lg:flex-row lg:gap-4 lg:flex-wrap">
        <button (click)="handleSubmitEmbedQuestion(firstQuestion)" class="w-full border border-[#111110] bg-[#FFF9F9] rounded-full px-4 py-3 flex justify-between items-center text-sm lg:w-[48%] lg:text-base">
          L'IA va-t-elle vraiment remplacer 80% des jobs ?
          <span>↗</span>
        </button>

        <button (click)="handleSubmitEmbedQuestion(secondQuestion)" class="w-full border border-[#111110] bg-[#FFF9F9] rounded-full px-4 py-3 flex justify-between items-center text-sm lg:w-[48%] lg:text-base">
          Est-ce que mettre son iPhone dans du riz ça marche ?
          <span>↗</span>
        </button>

        <button (click)="handleSubmitEmbedQuestion(thirdQuestion)" class="w-full border border-[#111110] bg-[#FFF9F9] rounded-full px-4 py-3 flex justify-between items-center text-sm lg:w-[48%] lg:text-base">
          C'est vrai que Coca-Cola va changer sa recette ?
        <span>↗</span>
        </button>

        <button (click)="handleSubmitEmbedQuestion(fourthQuestion)" class="w-full border border-[#111110] bg-[#FFF9F9] rounded-full px-4 py-3 flex justify-between items-center text-sm lg:w-[48%] lg:text-base">
          Question à poser à Vera
          <span>↗</span>
        </button>
      </div>

      <div class="text-center lg:flex lg:flex-col lg:items-center">
        <p class="text-gray-600 lg:text-base">Essayez Vera sur d’autres plateformes</p>
        <div class="flex justify-center gap-6 text-3xl mt-3 mb-14 lg:text-4xl">
          <img src="/images/whatsapp.png" alt="whatsapp" class="w-8 lg:w-10" />
          <img src="/images/telegram.png" alt="telegram" class="w-8 lg:w-10" />
          <img src="/images/instagram.png" alt="instagram" class="w-8 lg:w-10" />
        </div>
      </div>

      <div class="w-full h-px bg-black mt-4"></div>

      <div class="text-center text-[12px] text-gray-600 my-6 lg:text-sm">
        <p>Mentions légales • Politique de confidentialité</p>
      </div>

    </div>
  `
})
export class LandingComponent {
  constructor(private router: Router) {}
  firstQuestion: string = 'L\'IA va-t-elle vraiment remplacer 80% des jobs ?';
  secondQuestion: string = 'Est-ce que mettre son iPhone dans du riz ça marche ?';
  thirdQuestion: string = 'C\'est vrai que Coca-Cola va changer sa recette ?';
  fourthQuestion: string = 'Question à poser à Vera';

  handleSubmit() {
    const message = (document.querySelector<HTMLInputElement>('input[type="text"]')?.value || '').trim();
    this.router.navigate(['/chat'], { state: { initialMessage: message } });
  }

  handleSubmitEmbedQuestion(question: string) {
    this.router.navigate(['/chat'], { state: { initialMessage: question } });
  }

}
