export const articles = [
  {
    id: '1',
    title: 'Major Breakthrough in Renewable Energy Technology Announced',
    imageUrl: 'https://picsum.photos/seed/renewable-energy/1200/800',
    imageHint: 'abstract technology',
    content: `Scientists have announced a significant breakthrough in renewable energy storage, potentially revolutionizing how we power our world. The new technology, based on a novel crystalline material, can store solar and wind energy with unprecedented efficiency, boasting a 95% energy return rate. This development addresses the critical issue of intermittency in renewable sources, ensuring a stable power supply even when the sun isn't shining or the wind isn't blowing. Experts believe this could accelerate the global transition away from fossil fuels by making green energy more reliable and cost-effective than ever before. The research team is now working on scaling up production for commercial use, with pilot projects expected within the next two years.`
  },
  {
    id: '2',
    title: 'New Deep-Space Telescope Discovers Potentially Habitable Exoplanet',
    imageUrl: 'https://picsum.photos/seed/exoplanet-discovery/1200/800',
    imageHint: 'galaxy stars',
    content: `Astronomers are buzzing with excitement after the new Orion Deep-Field Telescope captured images of an Earth-sized exoplanet orbiting within the habitable zone of a nearby star. The planet, named "Zetura-B," shows atmospheric signatures that could indicate the presence of water vapor. While more data is needed, this discovery marks a pivotal moment in the search for life beyond our solar system. The Orion telescope, launched just last year, has already exceeded expectations with its advanced imaging capabilities.`
  },
  {
    id: '3',
    title: 'AI-Powered Drug Discovery Platform Accelerates Cancer Research',
    imageUrl: 'https://picsum.photos/seed/drug-discovery/1200/800',
    imageHint: 'dna microscope',
    content: `A new artificial intelligence platform developed by researchers at the Institute for Computational Medicine is drastically speeding up the process of discovering potential cancer-fighting drugs. By analyzing vast datasets of genetic information and molecular structures, the AI can identify promising compound candidates in a matter of days, a process that traditionally takes years. This innovation is expected to significantly reduce the cost and time of drug development, bringing new treatments to patients faster.`
  },
];

export type Article = typeof articles[0];

export const getArticleById = (id: string) => {
    return articles.find(article => article.id === id);
}
