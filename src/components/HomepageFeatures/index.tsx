import styles from './styles.module.css';
import useBaseUrl from '@docusaurus/useBaseUrl';


type FeatureItem = {
  title: string;
  image: string;
  description: React.ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Code pragmatist',
    image: '/img/code.svg',
    description: (
      <>
        Creates tools to simplify routines.<br/>Writes docs to improve usuabilities.
      </>
    ),
  },
  {
    title: 'UX perfectionist',
    image: '/img/ux.svg',
    description: (
      <>
        Believes in human-centric design.<br/>
        Designs experiences with HCI principles.
      </>
    ),
  },
  {
    title: 'Opensource enthusiast',
    image: '/img/oss.svg',
    description: (
      <>
        Enjoys learning from OSS.<br/>
        Relishes contributing to them.
      </>
    ),
  },
];


function Feature({title, image, description}: FeatureItem) {
  return (
    <div className={'col col--4'}>
      <div className="text--center">
        <img
          className={styles.featureSvg}
          alt={title}
          src={useBaseUrl(image)}
        />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
