using Microsoft.EntityFrameworkCore;
using Repositories.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories
{
    public class WebTicketDbContext : DbContext
    {
        public WebTicketDbContext(DbContextOptions<WebTicketDbContext> options) : base(options)
        {

        }

        public DbSet<Card> Cards { get; set; }
        public DbSet<AGCustomer> AgCustomers { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<ThongTinVe> ThongTinVes { get; set; }
        public DbSet<Users> Users { get; set; }
    }
}
