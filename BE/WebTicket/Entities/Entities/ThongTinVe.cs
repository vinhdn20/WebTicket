namespace Entities
{
    public class ThongTinVe : BaseEntity
    {
        public Guid AGCustomerId { get; set; }
        public virtual AGCustomer AGCustomer { get; set; }
        public DateTime NgayXuat { get; set; }
        public string GiaXuat { get; set; }
        public string AddOn { get; set; }
        public string ThuAG { get; set; }
        public string LuuY { get; set; }
        public bool VeHoanKhay { get; set; }
        
        public Guid CardId { get; set; }
        public virtual Card Card { get; set; }
        public virtual List<VeDetail> VeDetail { get; set; } = new List<VeDetail>();
    }
}
