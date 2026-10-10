// Contenu d'une case : image et/ou texte (aucune limite de longueur)
export default function TileContent({ text, image_url }) {
  return (
    <div className="bingo-tile-content">
      {image_url && <img className="bingo-tile-img" src={image_url} alt="" loading="lazy" draggable={false} />}
      {text && <div className="bingo-tile-text">{text}</div>}
    </div>
  );
}
